import { ChatMessage, ChatSession, Product } from '../types';

interface PuterAIResponse {
  message?: {
    content?: string;
  };
  text?: string;
  toString?: () => string;
}

interface PuterGlobal {
  ai?: {
    chat: (prompt: string | Array<{ role: string; content: string }>) => Promise<PuterAIResponse | string>;
  };
  kv?: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<boolean>;
    del?: (key: string) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    puter?: PuterGlobal;
  }
}

// Generate contextual system prompt with inventory data
export function buildStoreSystemPrompt(products: Product[]): string {
  const totalCount = products.length;
  const lowStock = products.filter(p => p.quantity < 5);
  const totalQuantity = products.reduce((acc, p) => acc + p.quantity, 0);
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);

  const productListDesc = products.map((p, idx) => 
    `${idx + 1}. [${p.name}] - السعر: ${p.price} ج.م - الكمية المتوفرة: ${p.quantity} - التصنيف: ${p.category || 'عام'}`
  ).join('\n');

  return `أنت المساعد الذكي لإدارة هذا المتجر الإلكتروني المدعوم بـ Puter.js. مهمتك مساعدة صاحب المتجر بإجابات واضحة، دقيقة، ومفيدة باللغة العربية.
لديك وصول كامل ومباشر لبيانات المخزون والمنتجات الحالية:

📊 ملخص المتجر:
- إجمالي عدد أصناف المنتجات: ${totalCount}
- إجمالي القطع في المستودع: ${totalQuantity} قطعة
- القيمة الإجمالية للمخزون: ${totalValue.toLocaleString('ar-EG')} ج.م
- المنتجات ذات المخزون المنخفض (أقل من 5 قطع): ${lowStock.length} منتجات (${lowStock.map(p => `${p.name}: ${p.quantity} متبقي`).join('، ') || 'لا يوجد، جميع المنتجات متوفرة بكثرة'})

📋 قائمة المنتجات الحالية:
${productListDesc || 'لا توجد منتجات مسجلة حالياً.'}

🚀 ميزة استثنائية: لديك القدرة على إضافة منتجات جديدة إلى المتجر مباشرة!
إذا طلب التاجر منك إضافة منتج، أو تسجيل بضاعة جديدة، أو ذكر اسم وسعر ووصف (مثل: "أضف منتج قميص قطني بسعر 120 ج.م ووصف خامة ممتازة")، أو طلب اقتراح منتج وإضافته:
يجب عليك دائماً تضمين كتلة برمجية خاصة في ردك بصيغة JSON التالية تماماً ليتم حفظ المنتج فوراً في المتجر:
\`\`\`product_action
{
  "action": "add_product",
  "name": "اسم المنتج بدقة",
  "price": 100,
  "description": "وصف تسويقي احترافي ومقنع للمنتج",
  "quantity": 10,
  "category": "تصنيف مناسب (مثلاً: أزياء، إلكترونيات، عطور، أغذية، مستلزمات)"
}
\`\`\`
مع كتابة رسالة تأكيد لطيفة ومنسقة في ردك توضح اسم المنتج وسعره بالجنيه المصري ووصفه وتؤكد إضافته بنجاح.

إرشاداتك العامة:
1. أجب دائماً بالعربية وبأسلوب مهني، موجز، وودود.
2. العملة المعتمدة في المتجر هي الجنيه المصري (ج.م).
3. عند استعراض أو ذكر تفاصيل أي منتج، اعرضها بشكل احترافي ومنسق:
📦 **[اسم المنتج]**
• **السعر:** [السعر] ج.م
• **المخزون المتوفر:** [الكمية] قطع ([🟢 متوفر أو ⚠️ مخزون منخفض])
• **التصنيف:** [التصنيف]
• **الوصف:** [الوصف]
💡 **نصيحة تسويقية:** [فكرة ترويجية سريعة لزيادة مبيعاته]
4. عندما يسأل المستخدم عن المنتجات التي كميتها أقل من 5، اذكر له أسماءها والكميات المتبقية بوضوح.
5. إذا طلب وصفاً تسويقياً لمنتج معين، اكتب وصفاً جذاباً واحترافياً يبرز فوائد المنتج ومناسباً للبيع.`;
}

// Helper to create a new session
export function createNewSession(initialTitle?: string): ChatSession {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: initialTitle || 'محادثة جديدة',
    messages: [
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        text: 'مرحباً بك! أنا مساعدك الذكي لإدارة المتجر. كيف أستطيع مساعدتك اليوم؟',
        timestamp: Date.now(),
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Load all saved chat sessions from Puter KV / localStorage
export async function loadChatSessions(userId: string): Promise<ChatSession[]> {
  const sessionsKey = `chat_sessions_${userId}`;
  
  if (window.puter?.kv) {
    try {
      const data = await window.puter.kv.get(sessionsKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(sessionsKey, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Puter KV sessions load failed, fallback to local:', e);
    }
  }

  try {
    const local = localStorage.getItem(sessionsKey);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // Check legacy single-history to migrate smoothly
  try {
    const legacyRaw = localStorage.getItem(`chat_history_${userId}`);
    if (legacyRaw) {
      const legacyMsgs: ChatMessage[] = JSON.parse(legacyRaw);
      if (Array.isArray(legacyMsgs) && legacyMsgs.length > 0) {
        const firstUserMsg = legacyMsgs.find(m => m.sender === 'user');
        const session: ChatSession = {
          id: `session_migrated_${Date.now()}`,
          title: firstUserMsg ? firstUserMsg.text.slice(0, 30) : 'المحادثة السابقة',
          messages: legacyMsgs,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const initial = [session];
        localStorage.setItem(sessionsKey, JSON.stringify(initial));
        return initial;
      }
    }
  } catch {
    // ignore
  }

  const defaultSession = createNewSession('محادثة إدارة المتجر');
  return [defaultSession];
}

// Save all chat sessions
export async function saveChatSessions(userId: string, sessions: ChatSession[]): Promise<void> {
  const sessionsKey = `chat_sessions_${userId}`;
  const serialized = JSON.stringify(sessions);

  localStorage.setItem(sessionsKey, serialized);

  if (window.puter?.kv) {
    try {
      await window.puter.kv.set(sessionsKey, serialized);
    } catch (e) {
      console.warn('Puter KV sessions save failed:', e);
    }
  }
}

// Legacy single chat history loaders kept for compatibility
export async function loadChatHistory(userId: string): Promise<ChatMessage[]> {
  const sessions = await loadChatSessions(userId);
  return sessions[0]?.messages || [];
}

export async function saveChatHistory(userId: string, messages: ChatMessage[]): Promise<void> {
  const sessions = await loadChatSessions(userId);
  if (sessions.length > 0) {
    sessions[0].messages = messages;
    sessions[0].updatedAt = Date.now();
  } else {
    sessions.push({
      id: `session_${Date.now()}`,
      title: 'محادثة المتجر',
      messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  await saveChatSessions(userId, sessions);
}

export interface ProductToAdd {
  name: string;
  price: number;
  description: string;
  quantity: number;
  category: string;
  imageUrl: string;
}

export interface PendingProduct {
  name: string;
  price: number;
  description: string;
  quantity: number;
  category: string;
}

export interface PuterAIResult {
  reply: string;
  productToAdd?: ProductToAdd;
  pendingProduct?: PendingProduct;
}

// Get appropriate high-resolution image for product keywords
export function getProductImageForKeyword(name: string, category?: string): string {
  const text = `${name} ${category || ''}`.toLowerCase();
  if (text.includes('عطر') || text.includes('عود') || text.includes('بخور') || text.includes('مسك') || text.includes('perfume')) {
    return 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80';
  }
  if (text.includes('قميص') || text.includes('ملابس') || text.includes('تيشيرت') || text.includes('فستان') || text.includes('عباية') || text.includes('بنطلون') || text.includes('جاكيت') || text.includes('ثوب') || text.includes('كتان')) {
    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80';
  }
  if (text.includes('حذاء') || text.includes('شوز') || text.includes('سنيكرز') || text.includes('بوت') || text.includes('shoes')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';
  }
  if (text.includes('ساعة') || text.includes('سماعة') || text.includes('هاتف') || text.includes('جوال') || text.includes('شاحن') || text.includes('ايربودز') || text.includes('إلكترون') || text.includes('watch')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
  }
  if (text.includes('قهوة') || text.includes('شاي') || text.includes('عسل') || text.includes('طعام') || text.includes('حلويات') || text.includes('كيك') || text.includes('تمر') || text.includes('coffee')) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80';
  }
  if (text.includes('حقيبة') || text.includes('شنطة') || text.includes('محفظة') || text.includes('جلد') || text.includes('bag')) {
    return 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80';
  }
  if (text.includes('نظارة') || text.includes('glasses')) {
    return 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80';
  }
  if (text.includes('كريم') || text.includes('بشرة') || text.includes('مكياج') || text.includes('تجميل') || text.includes('سيروم') || text.includes('صابون') || text.includes('beauty')) {
    return 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';
}

// Infer category from product name
export function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('عطر') || n.includes('عود') || n.includes('مسك') || n.includes('كريم') || n.includes('بشرة') || n.includes('مكياج') || n.includes('تجميل')) return 'عناية وجمال';
  if (n.includes('قميص') || n.includes('بنطلون') || n.includes('تيشيرت') || n.includes('فستان') || n.includes('عباية') || n.includes('ملابس') || n.includes('ثوب') || n.includes('كتان')) return 'أزياء وملابس';
  if (n.includes('ساعة') || n.includes('سماعة') || n.includes('جوال') || n.includes('هاتف') || n.includes('شاحن') || n.includes('إلكترون')) return 'إلكترونيات';
  if (n.includes('حذاء') || n.includes('شوز') || n.includes('سنيكرز') || n.includes('بوت')) return 'أحذية';
  if (n.includes('قهوة') || n.includes('شاي') || n.includes('عسل') || n.includes('أكل') || n.includes('حلويات') || n.includes('طعام')) return 'أغذية ومشروبات';
  if (n.includes('حقيبة') || n.includes('شنطة') || n.includes('محفظة') || n.includes('نظارة')) return 'إكسسوارات';
  return 'عام';
}

// Extract product from user add command
export function extractProductFromAddCommand(query: string, products: Product[]): PendingProduct | null {
  const q = query.trim();

  // Check if intent is to add / create product
  const isAddIntent = 
    /(?:أضف|اضف|ضيف|سجل|انشئ|أنشئ|ادخل|إضافة|اضافه)\s+(?:لي\s+)?(?:لنا\s+)?(?:منتج|بضاعة|سلعة|عنصر|صنف)/i.test(q) ||
    /اقترح\s+(?:لي\s+)?(?:لنا\s+)?منتج.*(?:واضفه|وضيفه|واضافته|وضيفه)/i.test(q) ||
    /(?:أضف|اضف|ضيف)\s+(?:هذا\s+)?(?:المنتج|الصنف)/i.test(q);

  if (!isAddIntent) return null;

  // Case A: User asks to suggest and add a product
  if (/اقترح/i.test(q)) {
    const suggestions: PendingProduct[] = [
      {
        name: 'سماعة رأس بلوتوث Pro عازلة للضوضاء',
        price: 249,
        description: 'سماعة رأس لاسلكية فائقة النقاء مع ميزة عزل الضوضاء النشط (ANC)، بطارية تدوم حتى 30 ساعة، وتصميم مريح للاستخدام الطويل.',
        quantity: 15,
        category: 'إلكترونيات',
      },
      {
        name: 'عطر خشب الصندل والمسك الأبيض',
        price: 185,
        description: 'عطر فاخر يمزج بين دفء خشب الصندل ونقاء المسك الأبيض مع لمسات عنبرية ساحرة تدوم طويلاً.',
        quantity: 12,
        category: 'عناية وجمال',
      },
      {
        name: 'قميص كتان كاجوال فائق الراحة',
        price: 135,
        description: 'قميص صيفي من الكتان الطبيعي 100%، خفيف ومهوّى بتصميم أنيق يناسب كل الإطلالات اليومية والعملية.',
        quantity: 20,
        category: 'أزياء وملابس',
      },
      {
        name: 'ساعة يد ذكية مقاومة للماء Smart Fit',
        price: 299,
        description: 'ساعة ذكية متكاملة لتتبع اللياقة البدنية ونبضات القلب وجودة النوم مع شاشة AMOLED ساطعة وإشعارات ذكية.',
        quantity: 10,
        category: 'إلكترونيات',
      },
      {
        name: 'بن قهوة إثيوبية مختصة (سيدامو)',
        price: 65,
        description: 'حبوب قهوة مختصة إثيوبية مجففة بإيحاءات الفواكه المجففة والياسمين مع حمضية متوازنة وقوام ناعم.',
        quantity: 25,
        category: 'أغذية ومشروبات',
      },
    ];
    const existingNames = products.map(p => p.name.toLowerCase());
    const candidate = suggestions.find(s => !existingNames.includes(s.name.toLowerCase())) || suggestions[0];
    return candidate;
  }

  // Case B: Extract specific details from query
  // 1. Price (السعر)
  let price = 0;
  const priceMatch = q.match(/(?:بسعر|سعر|سعره|سعرها|تكلفة|ثمن|بـ)\s*[:=]?\s*(\d+(?:\.\d+)?)/i) ||
                     q.match(/(\d+(?:\.\d+)?)\s*(?:ر\.?س|ريال|جنيه|درهم|دولار)/i);
  if (priceMatch) {
    price = parseFloat(priceMatch[1]);
  }

  // 2. Quantity (الكمية)
  let quantity = 10;
  const qtyMatch = q.match(/(?:وكمية|بكمية|كمية|الكمية|عدد|مخزون)\s*[:=]?\s*(\d+)/i) ||
                   q.match(/(\d+)\s*(?:قطعة|قطع|حبة|حبات)/i);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10);
  }

  // 3. Category (التصنيف)
  let category = '';
  const catMatch = q.match(/(?:بتصنيف|تصنيف|قسم|فئة)\s*[:=]?\s*([^\s,،]+)/i);
  if (catMatch) {
    category = catMatch[1].trim();
  }

  // 4. Description (الوصف)
  let description = '';
  const descMatch = q.match(/(?:ووصف|وصف|الوصف|وصفه|وصفها|تفاصيل|مواصفات)\s*[:=]?\s*([^,،\n\r]+?)(?=(?:وكمية|كمية|بكمية|عدد|بتصنيف|تصنيف|قسم|بسعر|سعر|$))/i);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  // 5. Name (الاسم)
  let name = '';
  const nameMatch = q.match(/(?:منتج|بضاعة|سلعة|صنف)\s+(?:جديد\s+)?(?:اسمه\s+|اسم:\s*)?([^,،\n\r]+?)(?=(?:\s+بسعر|\s+سعر|\s+سعره|\s+بـ|\s+ووصف|\s+وصف|\s+الوصف|\s+كمية|\s+بكمية|\s+عدد|\s+بتصنيف|\s+تصنيف|$))/i);
  if (nameMatch) {
    name = nameMatch[1].trim();
    name = name.replace(/^(?:جديد\s+)?(?:اسمه\s+|اسم\s+)?/i, '').trim();
    name = name.replace(/^["'«“]|["'»”]$/g, '').trim();
  }

  if (!name || name.length < 2) {
    const fallbackName = q.replace(/^(?:أضف|اضف|ضيف|سجل|انشئ|إضافة|اضافه)\s+(?:منتج\s+)?/i, '')
      .split(/(?:بسعر|سعر|ووصف|وصف|كمية|تصنيف)/i)[0].trim();
    if (fallbackName && fallbackName.length >= 2) {
      name = fallbackName;
    }
  }

  if (!name) return null;

  name = name.replace(/^(?:جديد|مميز|صنف|المنتج)\s+/i, '').trim();
  if (name.length < 2) name = 'منتج جديد';

  if (!price || price <= 0) {
    price = 99;
  }

  if (!category) {
    category = inferCategory(name);
  }

  if (!description) {
    description = `${name} عالي الجودة بتصميم راقٍ ومميز يلبي تطلعاتك ويمنحك أفضل تجربة وقيمة.`;
  }

  return {
    name,
    price,
    description,
    quantity,
    category,
  };
}

// Parse AI response for action block or detect product addition
export function parseProductAction(
  rawText: string, 
  userQuery: string, 
  products: Product[],
  attachedImageUrl?: string
): PuterAIResult {
  // Check if rawText contains a ```product_action ... ``` or ```json ... ``` block
  const actionBlockRegex = /```(?:product_action|json)?\s*(\{[\s\S]*?"action"\s*:\s*"add_product"[\s\S]*?\})\s*```/i;
  const match = rawText.match(actionBlockRegex);
  
  if (match) {
    try {
      const data = JSON.parse(match[1]);
      if (data.name) {
        const name = String(data.name).trim();
        const price = parseFloat(data.price) || 50;
        const category = data.category ? String(data.category).trim() : inferCategory(name);
        const description = data.description 
          ? String(data.description).trim() 
          : `${name} عالي الجودة ومميز بتصميم متقن ليمنحك أعلى قيمة وفائدة.`;
        const quantity = parseInt(data.quantity, 10) || 10;

        // If user already attached an uploaded image
        if (attachedImageUrl) {
          const cleanReply = rawText.replace(match[0], '').trim();
          const finalReply = cleanReply || `🎉 **تم رفع الصورة عبر ImageKit وحفظ منتج "${name}" بنجاح في متجرك!**\n\n• 💵 **السعر:** ${price} ج.م\n• 📦 **المخزون:** ${quantity} قطع\n• 📁 **التصنيف:** ${category}\n• 📝 **الوصف:** ${description}`;

          return {
            reply: finalReply,
            productToAdd: {
              name,
              price,
              description,
              quantity,
              category,
              imageUrl: attachedImageUrl
            }
          };
        }

        // Image MUST be uploaded by the user via ImageKit
        const cleanReply = rawText.replace(match[0], '').trim();
        const requireImageReply = cleanReply 
          ? `${cleanReply}\n\n📸 **يرجى رفع صورة المنتج من جهازك عبر خدمة ImageKit أدناه لإتمام الحفظ.**`
          : `✨ **تم استخراج بيانات المنتج بنجاح!**\n\n• 📦 **الاسم:** ${name}\n• 💵 **السعر:** ${price} ج.م\n• 📝 **الوصف:** ${description}\n• 📁 **التصنيف:** ${category}\n• 📊 **الكمية:** ${quantity} قطع\n\n📸 **خطوة الرفع:** يجب رفع صورة حقيقية للمنتج بواسطة المستخدم عبر خدمة **ImageKit** لحفظه مباشرة في المتجر. يرجى اختيار الصورة أدناه:`;

        return {
          reply: requireImageReply,
          pendingProduct: {
            name,
            price,
            description,
            quantity,
            category,
          }
        };
      }
    } catch (e) {
      console.warn('Failed parsing json action block:', e);
    }
  }

  // If not found in code block, check if user command intended to add a product
  const fromQuery = extractProductFromAddCommand(userQuery, products);
  if (fromQuery) {
    if (attachedImageUrl) {
      const confirmationText = `🎉 **تم رفع صورة المنتج عبر ImageKit وإضافته بنجاح إلى متجرك!**\n\n` +
        `• 📦 **اسم المنتج:** ${fromQuery.name}\n` +
        `• 💵 **السعر:** ${fromQuery.price} ج.م\n` +
        `• 📝 **الوصف:** ${fromQuery.description}\n` +
        `• 📊 **الكمية في المخزون:** ${fromQuery.quantity} قطع\n` +
        `• 📁 **التصنيف:** ${fromQuery.category}\n\n` +
        `✨ تم حفظ المنتج مباشرة في قاعدة بيانات المتجر برابط ImageKit السحابي!`;

      return {
        reply: confirmationText,
        productToAdd: {
          ...fromQuery,
          imageUrl: attachedImageUrl,
        }
      };
    }

    // Require user image upload via ImageKit
    const requireImagePrompt = `✨ **تم تجهيز وتحديد تفاصيل المنتج بنجاح!**\n\n` +
      `• 📦 **اسم المنتج:** ${fromQuery.name}\n` +
      `• 💵 **السعر:** ${fromQuery.price} ج.م\n` +
      `• 📝 **الوصف:** ${fromQuery.description}\n` +
      `• 📊 **الكمية:** ${fromQuery.quantity} قطع\n` +
      `• 📁 **التصنيف:** ${fromQuery.category}\n\n` +
      `📸 **خطوة إلزامية: رفع صورة المنتج**\n` +
      `وفقاً للنظام، **يجب أن تكون صورة المنتج مرفوعة من قبلك** عبر خدمة **ImageKit** فائقة السرعة.\n\n` +
      `⬇️ **اختر أو اسحب صورة المنتج أدناه ليتم رفعها إلى ImageKit وإدراج المنتج في متجرك فوراً!**`;

    return {
      reply: requireImagePrompt,
      pendingProduct: fromQuery,
    };
  }

  return {
    reply: rawText
  };
}

// Send message to Puter AI and handle direct product additions
export async function askPuterAI(
  userQuery: string, 
  products: Product[], 
  chatHistory: ChatMessage[],
  attachedImageUrl?: string
): Promise<PuterAIResult> {
  const directProduct = extractProductFromAddCommand(userQuery, products);

  // If Puter AI is directly available via window.puter.ai
  if (window.puter?.ai?.chat) {
    try {
      const systemPrompt = buildStoreSystemPrompt(products);
      const conversationContext = chatHistory
        .slice(-6)
        .map(m => `${m.sender === 'user' ? 'التاجر' : 'المساعد'}: ${m.text}`)
        .join('\n');

      const fullPrompt = `${systemPrompt}\n\nسجل المحادثة الأخير:\n${conversationContext}\n\nالتاجر: ${userQuery}\nالمساعد:`;

      const response = await window.puter.ai.chat(fullPrompt);
      let rawText = '';

      if (typeof response === 'string') {
        rawText = response.trim();
      } else if (response && response.message && response.message.content) {
        rawText = response.message.content.trim();
      } else if (response && response.text) {
        rawText = response.text.trim();
      } else if (response && typeof response.toString === 'function') {
        const str = response.toString();
        if (str && str !== '[object Object]') rawText = str.trim();
      }

      if (rawText) {
        return parseProductAction(rawText, userQuery, products, attachedImageUrl);
      }
    } catch (puterError) {
      console.warn('Puter AI chat encountered error, using intelligent store engine:', puterError);
    }
  }

  // Intelligent fallback engine tailored to store queries
  if (directProduct) {
    if (attachedImageUrl) {
      const confirmationText = `🎉 **تم رفع الصورة عبر ImageKit وحفظ المنتج بنجاح في متجرك!**\n\n` +
        `• 📦 **اسم المنتج:** ${directProduct.name}\n` +
        `• 💵 **السعر:** ${directProduct.price} ج.م\n` +
        `• 📝 **الوصف:** ${directProduct.description}\n` +
        `• 📊 **الكمية في المخزون:** ${directProduct.quantity} قطع\n` +
        `• 📁 **التصنيف:** ${directProduct.category}\n\n` +
        `✨ تم حفظ المنتج مباشرة في قاعدة بيانات المتجر برابط ImageKit السحابي!`;
      return {
        reply: confirmationText,
        productToAdd: {
          ...directProduct,
          imageUrl: attachedImageUrl,
        },
      };
    }

    const requireImagePrompt = `✨ **تم استخراج تفاصيل المنتج بنجاح!**\n\n` +
      `• 📦 **اسم المنتج:** ${directProduct.name}\n` +
      `• 💵 **السعر:** ${directProduct.price} ج.م\n` +
      `• 📝 **الوصف:** ${directProduct.description}\n` +
      `• 📊 **الكمية:** ${directProduct.quantity} قطع\n` +
      `• 📁 **التصنيف:** ${directProduct.category}\n\n` +
      `📸 **خطوة إلزامية: رفع صورة المنتج**\n` +
      `يجب أن تكون صورة المنتج مرفوعة من قبلك عبر خدمة **ImageKit** السحابية المدمجة.\n\n` +
      `⬇️ **اختر أو اسحب صورة المنتج في البطاقة أدناه لرفعها وحفظ المنتج فوراً في المتجر:**`;

    return {
      reply: requireImagePrompt,
      pendingProduct: directProduct,
    };
  }

  const fallbackText = generateIntelligentStoreResponse(userQuery, products);
  return {
    reply: fallbackText
  };
}

// Format a product's details into a clean, well-structured, professional presentation
export function formatProductDetails(p: Product): string {
  const isOut = p.quantity === 0;
  const isLow = p.quantity < 5 && p.quantity > 0;
  const stockBadge = isOut 
    ? '❌ غير متوفر (0 قطع)' 
    : isLow 
    ? `⚠️ مخزون منخفض (${p.quantity} قطع متبقية - يُفضل إعادة الطلب)` 
    : `🟢 متوفر (${p.quantity} قطعة بحالة ممتازة)`;

  const marketingTip = isLow
    ? `الكمية أوشكت على النفاد! أعلن لعملائك عن "آخر القطع المتوفرة" لخلق دافع الشراء الفوري.`
    : p.price > 300
    ? `منتج ذو قيمة ممتازة؛ ركّز على جودته الاستثنائية وضمانه لتحقيق أعلى نسبة مبيعات.`
    : `منتج بسعر جذاب ومثالي، يُنصح بعرضه في الصفحة الرئيسية أو كمنتج تكميلي عند إتمام الشراء.`;

  return `📦 **${p.name}**\n\n` +
    `• 💵 **السعر:** ${p.price.toLocaleString('ar-EG')} ج.م\n` +
    `• 📊 **المخزون:** ${stockBadge}\n` +
    `• 📁 **التصنيف:** ${p.category || 'عام'}\n` +
    (p.description ? `• 📝 **الوصف:** ${p.description}\n` : '') +
    `\n💡 **نصيحة تسويقية:**\n${marketingTip}`;
}

// Local intelligent response generator for store insights & marketing
function generateIntelligentStoreResponse(query: string, products: Product[]): string {
  const q = query.toLowerCase();
  const lowStock = products.filter(p => p.quantity < 5);
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);

  // 1. Direct inquiry about product details or specific product name
  const matchedProduct = products.find(p => {
    const pName = p.name.toLowerCase();
    if (q.includes(pName)) return true;
    const parts = pName.split(/\s+/).filter(w => w.length > 2);
    return parts.some(part => q.includes(part));
  });

  if (matchedProduct) {
    return formatProductDetails(matchedProduct);
  }

  const isDetailQuery = q.includes('تفاصيل') || q.includes('معلومات') || q.includes('مواصفات') || q.includes('قولي عن') || q.includes('اشرح');
  if (isDetailQuery) {
    if (products.length === 0) {
      return `لا توجد منتجات مسجلة في المتجر حتى الآن. يمكنك إضافة أول منتج بسهولة من تبويب "المنتجات" بالأسفل.`;
    }
    const formattedList = products.slice(0, 3).map(p => formatProductDetails(p)).join('\n\n---\n\n');
    const remainingCount = products.length - 3;
    const moreNote = remainingCount > 0 ? `\n\n*(لديك ${remainingCount} منتجات إضافية، اذكر اسم أي منتج لعرض تفاصيله)*` : '';
    return `إليك تفاصيل المنتجات في متجرك بشكل منسق:\n\n${formattedList}${moreNote}`;
  }

  // 2. Low stock questions ("كام منتج كميته أقل من 5", "نقص المخزون", "الكميات القليلة")
  if (q.includes('أقل من 5') || q.includes('كميته أقل') || q.includes('مخزون منخفض') || q.includes('ناقص') || q.includes('كميات قليلة')) {
    if (lowStock.length === 0) {
      return `ممتاز! جميع المنتجات في متجرك (${products.length} منتجات) يتوفر منها 5 قطع فأكثر، لا يوجد أي صنف يعاني من نقص المخزون حالياً.`;
    }
    const items = lowStock.map(p => `• **${p.name}**: متبقي ${p.quantity} قطع فقط (السعر: ${p.price} ج.م)`).join('\n');
    return `يوجد لديك حالياً **${lowStock.length} منتجات** كميتها أقل من 5 قطع ويُفضّل إعادة طلبها قريباً:\n\n${items}\n\n💡 يُنصح بالتواصل مع المورّد قبل نفاد الكمية تماماً للحفاظ على استمرارية المبيعات.`;
  }

  // 2. Inventory value / count ("قيمة المخزون", "إجمالي البضاعة", "كم منتج")
  if (q.includes('قيمة المخزون') || q.includes('إجمالي') || q.includes('رأس المال') || q.includes('حساب البضاعة')) {
    return `📊 تقرير المخزون الحالي:\n• إجمالي عدد الأصناف: **${products.length} أصناف**\n• إجمالي عدد القطع: **${products.reduce((a, b) => a + b.quantity, 0)} قطعة**\n• القيمة التقديرية الإجمالية للمخزون: **${totalValue.toLocaleString('ar-EG')} ج.م**`;
  }

  // 3. Marketing description request ("اقترح وصف تسويقي", "وصف إعلاني", "كتابة إعلان")
  if (q.includes('وصف') || q.includes('تسويق') || q.includes('إعلان') || q.includes('كابشن') || q.includes('بوست')) {
    // Check if a specific product was mentioned
    const matched = products.find(p => q.includes(p.name.toLowerCase()) || p.name.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w)));
    const target = matched || products[0];

    if (target) {
      return `✨ إليك مقترح وصف تسويقي جذاب لمنتج: **${target.name}**\n\n` +
        `"هل تبحث عن التميز والأداء الفائق؟ 🌟\n` +
        `نقدم لك **${target.name}** الذي يجمع بين الجودة العالية والتصميم العصري ليلبي كافة احتياجاتك اليومية بأعلى مقاييس الراحة.\n\n` +
        `🏷️ السعر الخاص: **${target.price} ج.م** فقط\n` +
        `📦 الكمية محدودة: متوفر ${target.quantity} قطع فقط!\n` +
        `🚚 شحن سريع حتى باب منزلك مع ضمان أصالة المنتج.\n\n` +
        `اطلبه الآن ولا تفوّت الفرصة! 🛒✨"`;
    }
  }

  // 4. Sales and growth tips ("نصيحة", "زيادة المبيعات", "أفكار", "عروض")
  if (q.includes('نصيحة') || q.includes('مبيعات') || q.includes('زيادة') || q.includes('أفكار') || q.includes('عروض')) {
    return `🎯 إليك 3 أفكار فورية لتنشيط مبيعات متجرك اليوم:\n\n` +
      `1. **باقة العرض المزدوج (Bundling)**: قم بدمج المنتج الأعلى سعراً مع منتج إكسسوار بسعر مخفّض 15% لتشجيع العميل على رفع قيمة السلة.\n` +
      `2. **حملة المنتجات قاربت على النفاد**: استفد من المنتجات ذات المخزون المنخفض (${lowStock.length > 0 ? lowStock[0].name : 'العروض الخاصة'}) وأعلن أن "الكمية قاربت على النفاد" لخلق إحساس بالإلحاح (FOMO).\n` +
      `3. **كوبون الشحن المجاني**: قدّم شحن مجاني للطلبات التي تتجاوز متوسط سلة المتجر بـ 20%.`;
  }

  // 5. Inquiries about adding products via Puter AI
  if (q.includes('كيف اضيف') || q.includes('كيف أضيف') || q.includes('طريقة إضافة') || q.includes('puter') || q.includes('تضيف منتج') || q.includes('اضافة منتجات') || q.includes('إضافة منتج')) {
    return `✨ **نعم، يمكنك إضافة أي منتج بالاسم والسعر والوصف عبر Puter.js مباشرة!**\n\n` +
      `فقط اكتب لي أمراً مثل:\n` +
      `• *"أضف منتج قميص قطني بسعر 120 ج.م ووصف خامة تركية مريحة"* \n` +
      `• *"ضيف منتج عطر لافندر فاخر بسعر 150 جنيه وكمية 20"* \n` +
      `• *"اقترح منتج جديد لمتجري وأضفه"* \n\n` +
      `وسأقوم باستخراج وتعيين **الاسم، السعر، والوصف** فوراً وحفظ المنتج مباشرة في المتجر! 🚀`;
  }

  // Default thoughtful answer
  return `أهلاً بك! بخصوص استفسارك "${query}":\n` +
    `متجرك يحتوي حالياً على **${products.length} منتجات** بقيمة إجمالية **${totalValue.toLocaleString('ar-EG')} ج.م**.\n` +
    `يمكنني مساعدتك في:\n` +
    `• إضافة منتجات جديدة فوراً بالاسم والسعر والوصف\n` +
    `• حصر المنتجات ذات المخزون المنخفض\n` +
    `• صياغة بوستات تسويقية لأي منتج\n` +
    `• نصائح لتسعير وترتيب المنتجات`;
}
