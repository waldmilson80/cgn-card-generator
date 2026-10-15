const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

app.post('/gerar-card', async (req, res) => {
  const { titulo, subtitulo, imagemUrl } = req.body;

  try {
    const browser = await puppeteer.launch({ 
      headless: 'new', 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; width: 1080px; height: 1350px; background-color: #1a1a1a; font-family: 'Montserrat', Arial, sans-serif; overflow: hidden; position: relative; }
          .bg { position: absolute; top: 0; left: 0; width: 1080px; height: 1350px; object-fit: cover; z-index: 1; }
          .overlay { position: absolute; top: 0; left: 0; width: 1080px; height: 1350px; background: radial-gradient(circle at 12% 12%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%), linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 15%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.8) 83%, rgba(0,0,0,0.95) 100%); z-index: 2; }
          .logo { position: absolute; top: 55px; left: 75px; width: 230px; z-index: 10; filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.4)); }
          .content { position: absolute; bottom: 0; left: 0; width: 1080px; padding: 0 75px 40px 75px; box-sizing: border-box; z-index: 5; display: flex; flex-direction: column; }
          .title { font-size: 42px; font-weight: 900; color: #ffffff; line-height: 1.18; margin: 0 0 16px 0; text-shadow: 0px 2px 8px rgba(0,0,0,0.8); text-align: left; }
          .subtitle { font-size: 26px; font-style: italic; font-weight: 800; color: #ffffff; line-height: 1.25; margin: 0 0 24px 0; text-shadow: 0px 2px 8px rgba(0,0,0,0.8); text-align: left; }
          .link-red { color: #e30613; font-style: italic; font-weight: 800; }
          .social-row { display: flex; align-items: center; width: 100%; margin-bottom: 18px; }
          .line { flex: 1; height: 2.5px; background-color: #e30613; }
          .icons { display: flex; gap: 12px; padding: 0 16px; }
          .circle { width: 30px; height: 30px; border-radius: 50%; background-color: #ffffff; display: flex; align-items: center; justify-content: center; }
          .domain { text-align: center; width: 100%; font-size: 27px; font-weight: 800; color: #ffffff; letter-spacing: 0.3px; }
        </style>
      </head>
      <body>
        <img class="bg" src="${imagemUrl}" crossorigin="anonymous" />
        <div class="overlay"></div>
        <img class="logo" src="https://blogger.googleusercontent.com/img/a/AVvXsEi4E2jKp6G8IUFdI5IlJdn0NQr1A_DlfyUe0r3RrlfS2AGJ73-6WGm65u81BwsXKg7bGVvGrysbpuTd6uiAppXhzWoPgCP89xanRbdSjUtttLCALl4PEzqbTrIxhe8c9tDwquZYMQj-pjK9ew7zRUF5qEaHoAIwgFW8Nn7mbhmuffn9JEbpqDtbqlugZIYy" />
        <div class="content">
          <h1 class="title">${titulo}</h1>
          <div class="subtitle">${subtitulo} <span class="link-red">materia completa em: www.centralgoiano.com.br</span></div>
          <div class="social-row">
            <div class="line"></div>
            <div class="icons">
              <div class="circle"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></div>
              <div class="circle"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg></div>
              <div class="circle"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.815 9 5.234V8z"/></svg></div>
            </div>
            <div class="line"></div>
          </div>
          <div class="domain">www.centralgoiano.com.br</div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const bufferImage = await page.screenshot({ type: 'png' });
    await browser.close();

    res.set('Content-Type', 'image/png');
    res.send(bufferImage);
  } catch (err) {
    res.status(500).send({ error: err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
