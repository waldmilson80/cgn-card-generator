// GERADOR OFICIAL VIA GEMINI (Ajustado para parágrafos menores e rodapé completo)
async function gerarLegendaGeminiOficial(tituloLimpo, textoCompletoMateria, apiKeyGemini) {
  if (!apiKeyGemini) {
    console.error("⚠️ ERRO: GEMINI_API_KEY não configurada no Render!");
    return "";
  }

  let modelos = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
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

  const prompt = `Escreva uma legenda em Português do Brasil com base estrita na matéria abaixo, sem inventar fatos.

DIRETRIZES DE ESTILO E ESTRUTURA:
1. Tom estritamente jornalístico, formal, sóbrio e informativo.
2. NÃO utilize emojis.
3. Divida o texto principal em parágrafos menores e bem distribuídos para facilitar a leitura rápida.
4. Adicione hashtags correspondentes ao tema específico da matéria no final.

ESTRUTURA OBRIGATÓRIA DO RODAPÉ (coloque exatamente este bloco ao final):
Para mais informações, acesse: www.centralgoiano.com.br

Tem uma informação ou vídeo exclusivo? Envie para o Central Goiano pelo WhatsApp (64) 9 8179-1016.

#CentralGoiano #Noticias [hashtag específica do assunto]

REGRA OBRIGATÓRIA DE SAÍDA:
Coloque o texto final da legenda ESTRITAMENTE dentro das tags <legenda> e </legenda>. Não escreva nada fora delas.

Título da Matéria: ${tituloLimpo}
Conteúdo da Matéria: ${textoCompletoMateria.substring(0, 4000)}`;

  for (const modelo of modelos) {
    try {
      const URL_API = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKeyGemini}`;
      
      const response = await fetch(URL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ 
              text: "Você é um jornalista e editor do portal Central Goiano. Sua escrita é jornalística, dividida em parágrafos menores, sem emojis. Sua única saída deve ser a legenda contida estritamente entre <legenda> e </legenda>." 
            }]
          },
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      });

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        let textoBruto = data.candidates[0].content.parts[0].text;
        let resultado = extrairApenasLegenda(textoBruto);
        if (resultado && resultado.length > 20) {
          console.log(`✅ Legenda gerada com sucesso via Gemini (${modelo})!`);
          return resultado;
        }
      }
    } catch (err) {}
  }

  return "";
}
