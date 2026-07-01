import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category?: string;
}

interface ParsedData {
  fixedCosts: { name: string; amount: number }[];
  categories: { name: string; icon: string; color: string }[];
  incomes: { name: string; amount: number; date: string }[];
  expenses: { category: string; amount: number; date: string }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { data: { user }, error: authError } = await adminClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sessão inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length > 8_000_000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Imagem inválida ou muito grande' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: openAiConfig, error: configError } = await adminClient
      .from("openai_config")
      .select("api_key, model")
      .maybeSingle();

    if (configError || !openAiConfig?.api_key) {
      console.error('OpenAI config error:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração da OpenAI não encontrada. Peça ao administrador para configurar a API Key.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = openAiConfig.api_key;
    const openaiModel = openAiConfig.model || "gpt-4o-mini";

    console.log('Processing transaction image with OpenAI...');

    const prompt = `Analise esta imagem de extrato bancário ou captura de transações financeiras.
Extraia TODAS as transações visíveis, identificando:
- Data da transação (formato YYYY-MM-DD)
- Descrição/nome da transação
- Valor (número positivo)
- Tipo: "income" para entradas/créditos (PIX recebido, salário, depósito, etc) ou "expense" para saídas/débitos (compras, pagamentos, transferências enviadas, etc)
- Categoria sugerida baseada na descrição

Retorne APENAS um JSON válido no seguinte formato, sem markdown ou texto adicional:
{
  "transactions": [
    {
      "type": "income" ou "expense",
      "amount": 123.45,
      "description": "Descrição da transação",
      "date": "2024-01-15",
      "category": "Categoria sugerida"
    }
  ]
}

Se não encontrar transações, retorne: {"transactions": []}

Categorias válidas: Mercado, Transporte, Saúde, Alimentação, Moradia, Salário, Pix, Transferência, Pagamento, Outros`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('Erro na API da OpenAI');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log('OpenAI response content:', content.substring(0, 500));

    // Parse AI response
    let transactions: Transaction[] = [];
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        transactions = parsed.transactions || [];
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      transactions = [];
    }

    // Convert to ParsedData format
    const defaultCategories = [
      { name: "Mercado", icon: "🧺", color: "#22c55e" },
      { name: "Transporte", icon: "🚗", color: "#3b82f6" },
      { name: "Saúde", icon: "🔋", color: "#ec4899" },
      { name: "Alimentação", icon: "🍽️", color: "#14b8a6" },
      { name: "Moradia", icon: "🏠", color: "#8b5cf6" },
      { name: "Salário", icon: "💼", color: "#10b981" },
      { name: "Pix", icon: "💸", color: "#06b6d4" },
      { name: "Transferência", icon: "↔️", color: "#f97316" },
      { name: "Pagamento", icon: "💳", color: "#ef4444" },
      { name: "Outros", icon: "📦", color: "#6b7280" },
    ];

    const parsedData: ParsedData = {
      fixedCosts: [],
      categories: defaultCategories,
      incomes: [],
      expenses: [],
    };

    const today = new Date().toISOString().split('T')[0];

    for (const tx of transactions) {
      const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount).replace(/[^\d.,]/g, '').replace(',', '.'));
      
      if (isNaN(amount) || amount <= 0) continue;

      const date = tx.date && /^\d{4}-\d{2}-\d{2}$/.test(tx.date) ? tx.date : today;
      const category = tx.category || 'Outros';

      if (tx.type === 'income') {
        parsedData.incomes.push({
          name: tx.description || 'Receita',
          amount,
          date,
        });
      } else {
        parsedData.expenses.push({
          category,
          amount,
          date,
        });
      }
    }

    console.log(`Parsed ${parsedData.incomes.length} incomes and ${parsedData.expenses.length} expenses`);

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar imagem';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});