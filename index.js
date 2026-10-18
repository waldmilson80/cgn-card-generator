// Sanitização estricta da legenda
function sanitizarLegendaFinal(textoBruto) {
  if (!textoBruto) return "";
  
  let limpo = textoBruto.replace(/<\/?legenda>/gi, '').trim();
  limpo = limpo.replace(/\*\*/g, '').replace(/\*/g, '');

  if (!limpo.includes("www.centralgoiano.com.br")) {
    limpo += `\n\nPara mais informações, acesse:\nwww.centralgoiano.com.br\n\n#CentralGoiano #Noticias #Goiás`;
  } else {
    if (!limpo.includes("#CentralGoiano")) {
      limpo += `\n\n#CentralGoiano #Noticias #Goiás`;
    }
  }

  return limpo.trim();
}

// 1️⃣ PRIMÁRIO: ChatGPT (OpenAI) - Fiel, profundo e sem invenção
async function gerarLegendaChatGPT(tituloLimpo, textoCompletoMateria) {
  const apiKeyOpenAI = process.env.OPENAI_API_KEY;
  if (!apiKeyOpenAI) {
    console.error("⚠️ OPENAI_API_KEY não configurada!");
    return "";
  }

  const prompt = `Você é o jornalista sênior e editor-chefe do portal Central Goiano. Escreva uma legenda de Instagram profissional, analítica e fluida baseada **EXCLUSIVAMENTE** nas informações da matéria abaixo.

REGRAS ABSOLUTAS:
1. FIDELIDADE TOTAL: Fale apenas sobre o que está no texto abaixo. Se o texto for curto, elabore e dê densidade à narrativa explorando os ângulos lógicos apresentados, mas **nunca invente** fatos, números, nomes ou acontecimentos externos.
2. ESTRUTURA DE PARÁGRAFOS: Organize o conteúdo exatamente em 4 parágrafos bem distribuídos (Contexto inicial, desenvolvimento dos fatos, repercussão/detalhes e fechamento analítico).
3. TOM: Estritamente jornalístico, formal, sóbrio e sem emojis (Proibido absoluto).
4. EXCLUSIVIDADE: Não cite fontes externas ou concorrentes.
5. RODAPÉ OBRIGATÓRIO (Coloque exatamente com esta formatação ao final):

Para mais informações, acesse:
www.centralgoiano.com.br

#CentralGoiano #Noticias #Goiás

Título da Matéria: ${tituloLimpo}
Texto Original da Matéria: ${textoCompletoMateria.substring(0, 4000)}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyOpenAI}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é o editor-chefe do Central Goiano. Escreva legendas jornalísticas estruturadas em 4 parágrafos, estritamente fiéis ao texto original, sem emojis e sem inventar dados." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1500
      })
    });

    const data = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      let resultado = sanitizarLegendaFinal(data.choices[0].message.content);
      if (resultado && resultado.length > 50) {
        console.log("✅ Legenda gerada com sucesso via OpenAI (ChatGPT)!");
        return resultado;
      }
    }
  } catch (err) {
    console.error("Erro na OpenAI:", err);
  }
  return "";
}

// 2️⃣ SECUNDÁRIO (BACKUP): Gemini - Caso a OpenAI falhe
async function gerarLegendaGeminiBackup(tituloLimpo, textoCompletoMateria, apiKeyGemini) {
  if (!apiKeyGemini) return "";

  let modelos = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-1.5-pro'];
  try {
    const resModels = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKeyGemini}`);
    if (resModels.ok) {
      const dataModels = await resModels.json();
      if (dataModels.models && Array.isArray(dataModels.models)) {
        let disponiveis = dataModels.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace('models/', ''))
          .sort((a, b) => b.localeCompare(a));
        if (disponiveis.length > 0) modelos = disponiveis;
      }
    }
  } catch (e) {}

  const prompt = `Você é o jornalista sênior e editor-chefe do portal Central Goiano. Escreva uma legenda de Instagram profissional, fluida e estruturada em 4 parágrafos, baseando-se **EXCLUSIVAMENTE** nas informações da matéria abaixo, sem inventar fatos externos.

REGRAS:
1. 4 parágrafos bem divididos.
2. Sem emojis.
3. Rodapé obrigatório:

Para mais informações, acesse:
www.centralgoiano.com.br

#CentralGoiano #Noticias #Goiás

Título: ${tituloLimpo}
Texto da Matéria: ${textoCompletoMateria.substring(0, 4000)}`;

  for (const modelo of modelos) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKeyGemini}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        })
      });

      const data = await res.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        let textoBruto = data.candidates[0].content.parts[0].text;
        let resultado = sanitizarLegendaFinal(textoBruto);
        if (resultado && resultado.length > 50) {
          console.log(`✅ Legenda gerada com sucesso via Gemini Backup (${modelo})!`);
          return resultado;
        }
      }
    } catch (err) {}
  }
  return "";
}
