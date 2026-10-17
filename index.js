const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/temp', express.static('/tmp'));

// Função para limpar lixos, HTML e remover marcas/nomes de fontes externas de forma definitiva
function limparTextoLixo(str) {
  if (!str) return "";
  return str
    .replace(/<!\[CDATA\[/gi, '') .replace(/\]\]>/gi, '')
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s*[-|–—]\s*(G1|Jornal Opção|Diário de Goiás|Badiinho|Zap Catalão|Portal Catalão|Blog da Verdade|Diante do Fato|SD News|TV Sudeste|Metrópoles|Poder360|O Antagonista).*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extrai estritamente o conteúdo dentro da tag <legenda>
function extrairApenasLegenda(textoBruto) {
  const match = textoBruto.match(/<legenda>([\s\S]*?)<\/legenda>/i);
  if (match && match[1].trim()) {
    return match[1].trim();
  }
  let limpo = textoBruto;
  if (limpo.includes('Final Version:')) {
    limpo = limpo.split('Final Version:').pop();
  } else if (limpo.includes('*Final Version:*')) {
    limpo = limpo.split('*Final Version:*').pop();
  }
  return limpo.replace(/<\/?legenda>/gi, '').trim();
}

app.post('/gerar-card', async (req, res) => {
  const { titulo, subtitulo, imagemUrl, textoMateria } = req.body;

  if (!titulo) {
    return res.status(400).json({ error: 'Título é obrigatório' });
  }

  const tituloLimpo = limparTextoLixo(titulo).replace(/^["“'«]|["”'»]$/g, '');
  let subtituloLimpo = limparTextoLixo(subtitulo || "");
  
  if (subtituloLimpo.length > 150) {
    subtituloLimpo = subtituloLimpo.substring(0, 147) + "...";
  }

  const API_KEY = process.env.GEMINI_API_KEY; 
  const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN; 
  const IG_USER_ID = process.env.INSTAGRAM_ACCOUNT_ID;            

  let browser = null;
  try {
    const executablePath = await chromium.executablePath();
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1080, height: 1350, deviceScaleFactor: 2 },
      executablePath: executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          width: 1080px; height: 1350px; background-color: #1a1a1a; 
          font-family: 'Montserrat', Arial, sans-serif; overflow: hidden; position: relative;
          -webkit-font-smoothing: antialiased;
        }
        #cgn-card { position: relative; width: 1080px; height: 1350px; background-color: #1a1a1a; overflow: hidden; }
        .cgn-final-bg-wrapper { position: absolute; top: 0; left: 0; width: 1080px; height: 1350px; overflow: hidden; z-index: 1; background-color: #111111; }
        .cgn-final-bg-wrapper img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cgn-final-gradient-overlay {
          position: absolute; top: 0; left: 0; width: 1080px; height: 1350px;
          background: radial-gradient(circle at 12% 12%, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0) 40%),
                      linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 15%, rgba(0, 0, 0, 0) 65%, rgba(0, 0, 0, 0.8) 83%, rgba(0, 0, 0, 0.95) 100%);
          z-index: 2;
        }
        .cgn-final-logo-wrapper { position: absolute; top: 55px; left: 75px; z-index: 10; }
        .cgn-final-logo-img { width: 230px; height: auto; display: block; filter: drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.4)); }
        .cgn-final-content-box { position: absolute; bottom: 0; left: 0; width: 1080px; padding: 0 75px 40px 75px; z-index: 5; display: flex; flex-direction: column; }
        .cgn-final-title { font-size: 42px; font-weight: 900; color: #ffffff; line-height: 1.18; margin: 0 0 16px 0; letter-spacing: -0.2px; text-shadow: 0px 2px 8px rgba(0, 0, 0, 0.8); text-align: left; }
        .cgn-final-subtitle { font-size: 26px; font-style: italic; font-weight: 800; color: #ffffff; line-height: 1.25; margin: 0 0 24px 0; letter-spacing: -0.2px; text-shadow: 0px 2px 8px rgba(0, 0, 0, 0.8); text-align: left; }
        .cgn-final-subtitle-link { color: #e30613; font-style: italic; font-weight: 800; }
        .cgn-final-social-row { display: flex; align-items: center; width: 100%; margin-bottom: 18px; }
        .cgn-final-line { flex: 1; height: 2.5px; background-color: #e30613; }
        .cgn-final-icons-group { display: flex; gap: 12px; padding: 0 16px; }
        .cgn-final-icon-circle { width: 30px; height: 30px; border-radius: 50%; background-color: #ffffff; display: flex; align-items: center; justify-content: center; }
        .cgn-final-icon-circle svg { fill: #000000; width: 16px; height: 16px; }
        .cgn-final-domain { text-align: center; width: 100%; font-size: 27px; font-weight: 800; color: #ffffff; letter-spacing: 0.3px; }
      </style>
    </head>
    <body>
      <div id="cgn-card">
        <div class="cgn-final-bg-wrapper">
          ${imagemUrl ? `<img src="${imagemUrl}" crossorigin="anonymous" />` : '<div style="width:100%;height:100%;background:#111;"></div>'}
        </div>
        <div class="cgn-final-gradient-overlay"></div>
        <div class="cgn-final-logo-wrapper">
          <img class="cgn-final-logo-img" crossorigin="anonymous" src="https://blogger.googleusercontent.com/img/a/AVvXsEi4E2jKp6G8IUFdI5IlJdn0NQr1A_DlfyUe0r3RrlfS2AGJ73-6WGm65u81BwsXKg7bGVvGrysbpuTd6uiAppXhzWoPgCP89xanRbdSjUtttLCALl4PEzqbTrIxhe8c9tDwquZYMQj-pjK9ew7zRUF5qEaHoAIwgFW8Nn7mbhmuffn9JEbpqDtbqlugZIYy" />
        </div>
        <div class="cgn-final-content-box">
          <h1 class="cgn-final-title">${tituloLimpo}</h1>
          <div class="cgn-final-subtitle">
            ${subtituloLimpo} <span class="cgn-final-subtitle-link">materia completa em: www.centralgoiano.com.br</span>
          </div>
          <div class="cgn-final-social-row">
            <div class="cgn-final-line"></div>
            <div class="cgn-final-icons-group">
              <div class="cgn-final-icon-circle"><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></div>
              <div class="cgn-final-icon-circle"><svg viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg></div>
              <div class="cgn-final-icon-circle"><svg viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.815 9 5.234V8z"/></svg></div>
            </div>
            <div class="cgn-final-line"></div>
          </div>
          <div class="cgn-final-domain">www.centralgoiano.com.br</div>
        </div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const imageBuffer = await page.screenshot({ type: 'png' });
    await browser.close();

    const fileName = `card-${Date.now()}.png`;
    const tempFilePath = path.join('/tmp', fileName);
    fs.writeFileSync(tempFilePath, imageBuffer);

    const publicImageUrl = `${req.protocol}://${req.get('host')}/temp/${fileName}`;

    // GERAÇÃO DA LEGENDA COM O GEMINI
    let textoMateriaLimpo = limparTextoLixo(textoMateria || subtitulo || tituloLimpo);
    const prompt = `Escreva uma legenda jornalística completa em Português do Brasil com base na matéria abaixo, mantendo um tamanho seguro, coeso e fluido (entre 1.000 e 1.400 caracteres), dividida em parágrafos bem estruturados.

DIRETRIZES DE ESTILO, ESTRUTURA E ANONIMATO:
1. Tom estritamente jornalístico, formal, sóbrio e informativo.
2. NUNCA cite, mencione ou faça referência ao nome de onde a matéria foi originalmente extraída (fontes externas, outros sites, blogs ou agências). O texto pertence exclusivamente ao portal Central Goiano.
3. NÃO utilize emojis no corpo do texto.
4. Garanta que o texto termine de forma completa, sem cortes secos ou frases inacabadas.
5. ESTRUTURA DO RODAPÉ (OBRIGATÓRIA):
Após finalizar o texto principal, pule uma linha e insira exatamente os blocos abaixo:

Para mais informações, acesse: www.centralgoiano.com.br

Tem uma informação ou vídeo exclusivo? Envie para o Central Goiano pelo WhatsApp (64) 9 8179-1016.

#[HashtagPrincipal1] #[HashtagPrincipal2]

REGRA OBRIGATÓRIA DE SAÍDA:
Coloque o texto final da legenda ESTRITAMENTE dentro das tags <legenda> e </legenda>.
Não escreva análises, rascunhos ou textos fora dessas tags.

Matéria:
Título: ${tituloLimpo}
Conteúdo: ${textoMateriaLimpo.substring(0, 3500)}`;

    let legendaFinal = "";
    try {
      let modeloUsado = 'gemini-1.5-flash';
      try {
        const resModels = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        if (resModels.ok) {
          const dataModels = await resModels.json();
          if (dataModels.models && Array.isArray(dataModels.models)) {
            const modelosDisponiveis = dataModels.models
              .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
              .map(m => m.name.replace('models/', ''))
              .sort((a, b) => b.localeCompare(a));
            if (modelosDisponiveis.length > 0) {
              modeloUsado = modelosDisponiveis[0];
            }
          }
        }
      } catch (e) {}

      const resGemini = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modeloUsado}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ 
              text: "Você é um jornalista sênior e editor-chefe do portal Central Goiano. Sua escrita é formal, jornalística e sem emojis. É estritamente proibido citar nomes de outras fontes ou sites de origem. Escreva textos coesos e completos, encerrando rigorosamente com a chamada do site, o canal de WhatsApp e as hashtags." 
            }]
          },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.1,
            maxOutputTokens: 1024
          }
        })
      });

      let dataGemini = await resGemini.json();
      if (dataGemini.candidates && dataGemini.candidates[0] && dataGemini.candidates[0].content) {
        let textoBruto = dataGemini.candidates[0].content.parts[0].text;
        legendaFinal = extrairApenasLegenda(textoBruto);
      }
    } catch (errGemini) {
      console.error("Erro no Gemini:", errGemini);
    }

    if (!legendaFinal || legendaFinal.length < 50) {
      legendaFinal = `${tituloLimpo}\n\nPara mais informações, acesse: www.centralgoiano.com.br\n\nTem uma informação ou vídeo exclusivo? Envie para o Central Goiano pelo WhatsApp (64) 9 8179-1016.\n\n#CentralGoiano #Noticias #Goias`;
    }

    // POSTAGEM AUTOMÁTICA NO INSTAGRAM
    let instagramStatus = "Sucesso";
    if (IG_ACCESS_TOKEN && IG_USER_ID) {
      try {
        const mediaUrl = `https://graph.facebook.com/v18.0/${IG_USER_ID}/media`;
        const resMedia = await fetch(mediaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: publicImageUrl,
            caption: legendaFinal,
            access_token: IG_ACCESS_TOKEN
          })
        });
        const dataMedia = await resMedia.json();

        if (dataMedia.id) {
          const creationId = dataMedia.id;
          await new Promise(r => setTimeout(r, 4000));

          const publishUrl = `https://graph.facebook.com/v18.0/${IG_USER_ID}/media_publish`;
          const resPublish = await fetch(publishUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: creationId,
              access_token: IG_ACCESS_TOKEN
            })
          });
          const dataPublish = await resPublish.json();
          console.log("Postado no Instagram com ID:", dataPublish.id);
        } else {
          console.error("Erro no container Instagram:", dataMedia);
          instagramStatus = "Erro container: " + JSON.stringify(dataMedia);
        }
      } catch (igErr) {
        console.error("Erro API Instagram:", igErr);
        instagramStatus = "Erro IG: " + igErr.toString();
      }
    } else {
      instagramStatus = "Tokens não encontrados";
    }

    res.json({
      sucesso: true,
      imageUrl: publicImageUrl,
      instagram: instagramStatus,
      legenda: legendaFinal
    });

  } catch (err) {
    if (browser) await browser.close();
    console.error("Erro Geral:", err);
    res.status(500).json({ error: err.toString() });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
