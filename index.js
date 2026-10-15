const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/gerar-card', async (req, res) => {
  const { titulo, subtitulo, imagemUrl } = req.body;

  if (!titulo) {
    return res.status(400).json({ error: 'Título é obrigatório' });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 1080px;
          height: 1350px;
          font-family: 'Montserrat', sans-serif;
          background-color: #111;
          overflow: hidden;
          position: relative;
        }
        .bg-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 1080px;
          height: 1350px;
          object-fit: cover;
          z-index: 1;
        }
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 1080px;
          height: 1350px;
          background: linear-gradient(180deg, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.95) 100%);
          z-index: 2;
        }
        .content {
          position: absolute;
          bottom: 80px;
          left: 80px;
          right: 80px;
          z-index: 3;
          color: #ffffff;
          display: flex;
          flex-direction: column;
        }
        .logo-container {
          position: absolute;
          top: 80px;
          left: 80px;
          z-index: 3;
          display: flex;
          align-items: center;
        }
        .logo-text {
          font-size: 56px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -2px;
          background: #d32f2f;
          padding: 8px 24px;
          border-radius: 8px;
        }
        .title {
          font-size: 52px;
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 24px;
          text-shadow: 0 4px 12px rgba(0,0,0,0.6);
        }
        .subtitle {
          font-size: 30px;
          font-weight: 400;
          line-height: 1.4;
          color: #e0e0e0;
          margin-bottom: 40px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.6);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 4px solid #d32f2f;
          padding-top: 30px;
        }
        .socials {
          display: flex;
          gap: 15px;
        }
        .social-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(5px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .social-icon svg {
          width: 24px;
          height: 24px;
          fill: #ffffff;
        }
        .website {
          font-size: 36px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      ${imagemUrl ? `<img class="bg-image" src="${imagemUrl}" />` : '<div class="bg-image" style="background:#222;"></div>'}
      <div class="overlay"></div>

      <div class="logo-container">
        <div class="logo-text">CGN</div>
      </div>

      <div class="content">
        <h1 class="title">${titulo}</h1>
        ${subtitulo ? `<p class="subtitle">${subtitulo}</p>` : ''}
        
        <div class="footer">
          <div class="socials">
            <div class="social-icon">
              <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </div>
            <div class="social-icon">
              <svg viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
            </div>
            <div class="social-icon">
              <svg viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.37 14.5 5 15.5 5H18V0h-3.808C10.59 0 9 1.588 9 4.71V8z"/></svg>
            </div>
          </div>
          <div class="website">www.centralgoiano.com.br</div>
        </div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const imageBuffer = await page.screenshot({ type: 'png' });

    await browser.close();

    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);

  } catch (err) {
    if (browser) await browser.close();
    console.error(err);
    res.status(500).json({ error: err.toString() });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
