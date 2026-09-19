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
    `${idx + 1}. [${p.name}] - السعر: ${p.price} ر.س - الكمية المتوفرة: ${p.quantity} - التصنيف: ${p.category || 'عام'}`
  ).join('\n');

  return `أنت المساعد الذكي لإدارة هذا المتجر الإلكتروني. مهمتك مساعدة صاحب المتجر بإجابات واضحة، دقيقة، ومفيدة باللغة العربية.
لديك وصول كامل ومباشر لبيانات المخزون والمنتجات الحالية:

📊 ملخص المتجر:
- إجمالي عدد أصناف المنتجات: ${totalCount}
- إجمالي القطع في المستودع: ${totalQuantity} قطعة
- القيمة الإجمالية للمخزون: ${totalValue.toLocaleString('ar-EG')} ر.س
- المنتجات ذات المخزون المنخفض (أقل من 5 قطع): ${lowStock.length} منتجات (${lowStock.map(p => `${p.name}: ${p.quantity} متبقي`).join('، ') || 'لا يوجد، جميع المنتجات متوفرة بكثرة'})

📋 قائمة المنتجات الحالية:
${productListDesc || 'لا توجد منتجات مسجلة حالياً.'}

إرشاداتك الهامة:
1. أجب دائماً بالعربية وبأسلوب مهني، موجز، وودود.
2. عند استعراض أو ذكر تفاصيل أي منتج، اعرضها بشكل احترافي، منسق ومريح جداً للقراءة كالتالي:
📦 **[اسم المنتج]**
• **السعر:** [السعر] ر.س
• **المخزون المتوفر:** [الكمية] قطع ([🟢 متوفر أو ⚠️ مخزون منخفض])
• **التصنيف:** [التصنيف]
• **الوصف:** [الوصف]
💡 **نصيحة تسويقية:** [فكرة ترويجية سريعة لزيادة مبيعاته]
3. عندما يسأل المستخدم عن المنتجات التي كميتها أقل من 5، اذكر له أسماءها والكميات المتبقية بوضوح.
4. إذا طلب وصفاً تسويقياً لمنتج معين، اكتب وصفاً جذاباً واحترافياً يبرز فوائد المنتج ومناسباً للبيع.`;
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

// Send message to Puter AI
export async function askPuterAI(
  userQuery: string, 
  products: Product[], 
  chatHistory: ChatMessage[]
): Promise<string> {
  const systemPrompt = buildStoreSystemPrompt(products);

  // Check if Puter AI is directly available
  if (window.puter?.ai?.chat) {
    try {
      // Construct prompt with context & recent conversation
      const conversationContext = chatHistory
        .slice(-6)
        .map(m => `${m.sender === 'user' ? 'التاجر' : 'المساعد'}: ${m.text}`)
        .join('\n');

      const fullPrompt = `${systemPrompt}\n\nسجل المحادثة الأخير:\n${conversationContext}\n\nالتاجر: ${userQuery}\nالمساعد:`;

      const response = await window.puter.ai.chat(fullPrompt);

      if (typeof response === 'string') {
        return response.trim();
      } else if (response && response.message && response.message.content) {
        return response.message.content.trim();
      } else if (response && response.text) {
        return response.text.trim();
      } else if (response && typeof response.toString === 'function') {
        const str = response.toString();
        if (str && str !== '[object Object]') return str.trim();
      }
    } catch (puterError) {
      console.warn('Puter AI chat encountered error, using intelligent store engine:', puterError);
    }
  }

  // Intelligent fallback engine tailored to store queries
  return generateIntelligentStoreResponse(userQuery, products);
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
    `• 💵 **السعر:** ${p.price.toLocaleString('ar-EG')} ر.س\n` +
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
    const items = lowStock.map(p => `• **${p.name}**: متبقي ${p.quantity} قطع فقط (السعر: ${p.price} ر.س)`).join('\n');
    return `يوجد لديك حالياً **${lowStock.length} منتجات** كميتها أقل من 5 قطع ويُفضّل إعادة طلبها قريباً:\n\n${items}\n\n💡 يُنصح بالتواصل مع المورّد قبل نفاد الكمية تماماً للحفاظ على استمرارية المبيعات.`;
  }

  // 2. Inventory value / count ("قيمة المخزون", "إجمالي البضاعة", "كم منتج")
  if (q.includes('قيمة المخزون') || q.includes('إجمالي') || q.includes('رأس المال') || q.includes('حساب البضاعة')) {
    return `📊 تقرير المخزون الحالي:\n• إجمالي عدد الأصناف: **${products.length} أصناف**\n• إجمالي عدد القطع: **${products.reduce((a, b) => a + b.quantity, 0)} قطعة**\n• القيمة التقديرية الإجمالية للمخزون: **${totalValue.toLocaleString('ar-EG')} ر.س**`;
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
        `🏷️ السعر الخاص: **${target.price} ر.س** فقط\n` +
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

  // Default thoughtful answer
  return `أهلاً بك! بخصوص استفسارك "${query}":\n` +
    `متجرك يحتوي حالياً على **${products.length} منتجات** بقيمة إجمالية **${totalValue.toLocaleString('ar-EG')} ر.س**.\n` +
    `يمكنني مساعدتك في:\n` +
    `• حصر المنتجات ذات المخزون المنخفض\n` +
    `• صياغة بوستات تسويقية لأي منتج\n` +
    `• نصائح لتسعير وترتيب المنتجات`;
}
