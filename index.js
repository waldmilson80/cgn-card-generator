// INTEGRAÇÃO COM O SERVIDOR DO RENDER (Com Timeout de Segurança para Não Travar o Apps Script)
            try {
              let urlCardServer = "https://cgn-card-generator-9qbj.onrender.com/gerar-card";
              let imagemParaEnvio = imagens.length > 0 ? imagens[0] : "";
              
              let payloadCard = {
                titulo: titleClean,
                subtitulo: item.description || titleClean,
                imagemUrl: imagemParaEnvio,
                textoMateria: textoHtml.replace(/<[^>]*>?/gm, ' ')
              };

              Logger.log("⏳ Enviando para o Servidor de Cards (Render)...");
              
              // Adicionado controle de limite de tempo (timeout de 45s) e tratamento de exceção
              let resCard = UrlFetchApp.fetch(urlCardServer, {
                method: "post",
                contentType: "application/json",
                payload: JSON.stringify(payloadCard),
                muteHttpExceptions: true,
                timeoutInSeconds: 45 // Impede que o Apps Script fique preso esperando o Render
              });

              let respostaTexto = resCard.getContentText();
              Logger.log("📥 Resposta do Servidor de Cards: " + respostaTexto);

              try {
                let jsonResposta = JSON.parse(respostaTexto);
                if (jsonResposta.sucesso === true) {
                  Logger.log("📸 Card gerado e postado no Instagram com sucesso! URL: " + jsonResposta.imageUrl);
                } else {
                  Logger.log("⚠️ Servidor de Cards informou: " + (jsonResposta.mensagem || jsonResposta.instagram || "Ação ignorada."));
                }
              } catch (parseErr) {
                Logger.log("ℹ️ Resposta recebida, mas formato não JSON.");
              }

            } catch (errCard) {
              Logger.log("⚠️ Servidor de Cards demorou para responder ou falhou: " + errCard.toString());
            }
