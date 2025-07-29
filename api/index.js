const express = require('express'); 
const app = express();
const port = 3000
const cors = require('cors')

var corsOptions = {
  origin: ['https://emoji575.suddenghazals.com', 'https://www.emoji575.suddenghazals.com', 'http://emoji575.netlify.app/'],
  optionsSuccessStatus: 200 
}


function smarten(string)  {
  string = string.replace(/(^|[-\u2014/([{"\s])'/g, '$1\u2018'); // opening singles
  string = string.replace(/'/g, '\u2019'); // closing singles & apostrophes
  string = string.replace(/(^|[-\u2014/([{\u2018\s])"/g, '$1\u201c'); // opening doubles
  string = string.replace(/"/g, '\u201d'); // closing doubles
  string = string.replace(/--/g, '\u2014'); // em-dashes

  return string;
};

async function requestHaiku(text) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2:free",
        messages: [
          {
            role: "user",
            content: `Generate a haiku from the following keywords: ${text.match(/[^_\W]+/g).join(' ')}.`
          }
        ]
      })
    });

    const data = await response.json();

    // Assuming the haiku lives here 👇
    const haiku = smarten(data.choices?.[0]?.message?.content);
    console.log(haiku)
    return haiku || "No haiku found, only silence in the breeze.";
  } catch (err) {
    console.error("Haiku fetch failed:", err);
    return "A poem was lost... blown away by error winds.";
  }
}

if (process.env.NODE_ENV !== 'production') {
  require('dotenv-safe').config()
}
app.get('/', async (req, res) => {
  res.send('Emoji 575')
})
app.get('/api', cors(corsOptions), async (req, res) => {

  if (!req.query.text) {
    return res.send({error: 'You must provide keywords'})
  }
  else {
    const result = await requestHaiku(req.query.text);

    res.send(result)}
  })

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

module.exports = app
