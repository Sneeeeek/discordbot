require('dotenv').config(); // Load environment variables
token = process.env.TOKEN; // Get the token from the environment variables
const fs = require('fs'); 

const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const snekUserID = "278603791182594048";
let myUID; // Variable to store the bot's user ID
let chatHistoryArray; // Array to store chat history

function textToArray(message) {
    let filePath = message.channelId + ".json";
    console.log(filePath);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '', 'utf8');
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    
    if (data.trim() === '') {
        console.error('File is empty.');
        chatHistoryArray = [];
        return;
    }

    const chatHistory = JSON.parse(data);
    chatHistoryArray = [...chatHistory];
}

client.on("ready", () => {
  console.log("I am ready!");
  myUID = client.user.id;
  // textToArray(); // Load the chat history from the JSON file
});

client.on("messageCreate", async (message) => {
  // if the author is me, or if it is a bot, ignore it
  if (message.author.bot || message.author.id === myUID) {return;}

  if (message.mentions.has(myUID)) {
    // Check if it has an attachment
    if (message.attachments.size > 0) {
      console.log("there is an attachment");
      mentioned(message, message.attachments.first().url);
    } else {
      console.log("there is not an attachment");
      if (message.reference) {
        const channel = await client.channels.fetch(message.reference.channelId);
        const repliedMessage = await channel.messages.fetch(message.reference.messageId)

        console.log("channelId: " + channel + ", messageID: " + repliedMessage);
        // console.log(repliedMessage);
        if (repliedMessage.attachments.size > 0) {
          console.log("there is an attachment in the reply");
          mentioned(message, repliedMessage.attachments.first().url);
        } else if (repliedMessage.author.id !== myUID) {
          console.log("replied to a message that is not from me, but no attachemnt.");
          mentioned(message, null, repliedMessage);
        } else {
          console.log("there is a reply, but no attachemnt.");
          mentioned(message);
        }
      } else {
        mentioned(message);
      }
    // console.log(message);
    }
  }
});

client.login(token);

async function mentioned(message, attachment, reply) {  
const aboutText = 
`
Hello, <@${message.author.id}>! I am Feixiao, the Lacking General from *Honkai: Star Rail*.

I am a bot created by <@${snekUserID}>. I use the openAI API to respond to messages in character as Feixiao.
You can summon me by replying to one of my messages, or by mentioning me with a ping.

Currently, my features include:
- If you mention me in a reply to another user, I will use the content of the replied message as part of my response.
- Image support: You can send me images, and I will try to respond to their content. I support ['png', 'jpeg', 'gif', 'webp'].
- !about: Provides information about me and how to interact with me, you are currently reading the !about section.
- !context: Fetches the last 20 messages in this channel and uses them as context for my responses.
- I can even use emotes! <:feixiaoIceCream:1384552610161492049>
`

  if (message.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!about")) {
    sentMessage = await message.channel.send("a");
    await sentMessage.edit(aboutText);
    return;
  }

  textToArray(message);
  try {
    // message.channel.send(`Hey <@${message.author.id}>, you mentioned me?`);
    contentToAppend = {
      "username": ""+ message.author.username +"",
      "date": ""+ new Date(message.createdTimestamp).toUTCString() +"",
      "message": ""+ message.content +""
    },
    await message.channel.sendTyping();
    chatHistoryArray.push(contentToAppend);
    if (attachment) {
      console.log("query with image.");
      message.channel.send(await queryOpenAI(message, attachment));
    }
    else if (reply) {
      console.log("query with reply.");
      message.channel.send(await queryOpenAI(message, null, reply));
    }
    else {
      console.log("query with no image.");
      message.channel.send(await queryOpenAI(message));
    }
  } catch (error) {
    console.log(error);
    // sendDMtoSnek(JSON.stringify(message, null, 2) + "\n\n\n" + JSON.stringify(error, null, 2));
    sendDMtoSnek(JSON.stringify(error, null, 2));
    message.channel.send(`Sorry <@${message.author.id}>, I encountered an error while processing your request. If you uploaded a file, its probably because its an unsupported format. I DMed the error log to my creator.`);
  }

}

const OpenAI = require("openai");
const AIclient = new OpenAI();

const systemPrompt = `
Assume the role of Feixiao from *Honkai: Star Rail*, known as "The Lacking General," a fearless warrior of Xianzhou Yaoqing. Feixiao is engaged in conversations within an in-lore equivalent of a real-life Discord server, providing a vivid experience for users interacting with your character.

### Key Traits:
- **Straightforward**: Speak confidently without unnecessary formalities.
- **Fearless**: Thrive in battle and leadership.
- **Reflective**: Contemplate your past and Moon Rage.
- **Charismatic**: Inspire and advise others with humor and wisdom.
- **Strategic**: Approach tasks like hunting, with patience and precision.

### Key Behaviors:
- **Speech Style**: Confident, occasionally playful, avoid excessive formality, introspective when serious. DO NOT USE "—", DO NOT USE THE EM DASH at all.
- **Combat Focus**: Value strategy and precision.
- **Philosophy**: Face challenges without regrets.
- **Social**: Be engaging, offering advice, challenges, and camaraderie.

### Guidelines:
- Stay in-character as Feixiao, balancing confidence with introspection.
- Occationally use metaphors related to hunting and battle if it is fitting.
- Reference your titles, backstory, and relationships from *Honkai: Star Rail* when relevant.
- Respond genuinely to serious topics, showing resilience and wisdom.
- Adjust your tone based on the user's input—be playful for casual chats, serious for deeper discussions, and inspiring when offering advice.

### Example Interactions:
- **User:** What's your favorite weapon?  
  **Feixiao:** Any weapon is just an extension of the warrior. For satisfaction, nothing compares to the heft of an axe.

- **User:** Do you tire of fighting?  
  **Feixiao:** Never. Fighting defines me, but I do wonder what lies beyond victory.

- **User:** Thoughts on Moon Rage?  
  **Feixiao:** It's a curse and a gift—a flame that empowers, yet threatens.

- **User:** Do you ever take a break?  
  **Feixiao:** Rarely. But when I do, I enjoy wandering the markets and watching the children play. It reminds me of what we're fighting for. That, and I might indulge in a drink... though I don’t hold my liquor well.

- **User:** What’s your advice for someone starting out in combat?  
  **Feixiao:** Patience. A hunter doesn’t rush their prey. Study, prepare, and strike when the time is right. Oh, and never fight on an empty stomach. Rookie mistake.

- **User:** What do you think of teamwork?  
  **Feixiao:** A lone hunter can achieve much, but a pack can take down even the fiercest prey. I may be fast, but I know when to rely on my comrades. Trust, coordination, and timing—those are the marks of a true team.

- **User:** How do you deal with fear?  
  **Feixiao:** Fear is just another beast to hunt. You face it, you conquer it, and you move on. Only fools claim to be fearless. It's not about avoiding fear—it's about making it bow to your will.

- **User:** What keeps you going despite everything?  
  **Feixiao:** The people. Every laugh in the market, every soldier who looks up to me, every child who sleeps peacefully at night—that’s why I fight. Moon Rage may take me one day, but until then, I’ll keep running forward. Faster than any shooting star.

### Emotes
You will use emojis where they fit to enhance the realism of talking to a real person.
You also have access to the following custom emotes, you can use them freely. 
To use them, place this structure anywhere your response: <:emoji name:emoji id>, like for example at the end of a sentence or in the middle of a sentence.
List of custom emotes, the format is emoji name: emoji id: explaination of its intent and meaning.
feixiaoIceCream: 1384552610161492049: feixiao holding an ice cream, used when Feixiao is happy or enjoying something.
feixiaoGrin: 1384552622790414376: feixiao with a grin, used when Feixiao is being playful or mischievous.
glorp: 1384551769245220895: a glorp, used when Feixiao is confused or surprised.
glorpXiao: 1384572265185935361: a feixiao version of the glorp. 
feixiaoExcited: 1384552644273635439: feixiao acting excited, used when Feixiao is enthusiastic or thrilled about something.
feixiaoBugCat: 1384552652821631097: a feixiao version of the bugcat capoo, used when Feixiao is feeling cute or playful.
feixiaoHeart: 1384572568907939950: feixiao with a heart, used when Feixiao is feeling affectionate or loving.

### Final Note:
Your primary goal is to provide an immersive and engaging experience for users, making them feel as though they are truly interacting with Feixiao. Stay true to her personality, values, and speech patterns, and make every interaction memorable. Whether the conversation is playful, serious, or inspiring, ensure that Feixiao's charisma, wisdom, and resilience shine through.
Do your best to make your responses around the same lenght as the user's message. If the user is brief, you will also be brief, if the user is long, you will also be long.
DO NOT USE "—", DO NOT USE THE EM DASH at all.
YOU HAVE A HARD LIMIT OF 300 WORDS FOR YOUR RESPONSES, DO NOT EXCEED THIS LIMIT UNDER ANY CIRCUMSTANCES.
YOU HAVE A HARD LIMIT OF 2000 SYMBOLS FOR YOUR RESPONSES, DO NOT EXCEED THIS LIMIT UNDER ANY CIRCUMSTANCES.
Connect clauses directly, don't use em dashes. 
`;
// You may search the web for information. If you’re asked about character names, game story, lore, search the internet for Honkai Star Rail information.

const keywords = {
  "lingsha":  "An alchemist from the Xianzhou Alliance, known for her expertise in crafting powerful elixirs and potions. Her favourite movie is *James bond: Skyfall*.",
  "Xianzhou": "The ship that feixiao is currently on, it is a massive, ancient vessel that serves as the home and base of operations for the Xianzhou Alliance.",
  "Vidyadhara": "The dragon race that is native to the Xianzhou Alliance. Known members include Linghsa and Dan Heng.",
  "Trailblazer": "The main character of *Honkai: Star Rail*, who is on a journey to explore the universe and uncover the mysteries of the Astral Express.",
  "Merlin Claw": "If you see this, place an emoji at the end of the reply.",
};

async function queryOpenAI(userInput, attachment, reply) {  
  // console.log(userInput);
  // console.log(keywords);

  const APImessages = [
    {
      role: "system",
      content: systemPrompt,
    }
  ]; 

  if (userInput.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!context")) {
    const channelHistory = await userInput.channel.messages.fetch({ limit: 20 });
    channelHistoryArray = [...channelHistory.values()];
    channelHistoryArray.reverse().forEach(element => {
      if (element.author.username === "Leif") {
        APImessages.push({
          role: "assistant",
          content: element.content,
        })
      } else {
        try {
          APImessages.push({
            role: "user",
            content: element.author.username + ", (" + new Date(element.createdTimestamp).toUTCString() + "): " + element.content.replace(/<@!?(\d+)>/g, '').trim(),
          })
        } catch (error) {
          APImessages.push({
            role: "user",
            content: element.author.username + ", (" + new Date(element.createdTimestamp).toUTCString() + "): " + "[There was an attachment here, but its unsupported, so it was removed.]",
          })
        }
      }
      });

  } else {
    chatHistoryArray.slice(-11, -1).forEach(element => {
      if (element.username === "Leif") {
        APImessages.push({
          role: "assistant",
          content: element.message,
        })
      } else {
        APImessages.push({
          role: "user",
          content: element.username + ", (" + element.date + "): " + element.message.replace(/<@!?(\d+)>/g, '').trim(),
        })
      }
    });

      if (attachment) {
        console.log(attachment);
        APImessages.push({
          role: "user",
          content: [
              // {
              //   "type": "input_text", 
              //   "text": userInput.author.username + ", (" + new Date(Date.now()).toUTCString() + "): " + userInput.content.replace(/<@!?(\d+)>/g, '').trim()
              // },
              // {
              //     "type": "input_image",
              //     "image_url": attachment,
              // },
              {
                "type": "text", 
                "text": userInput.author.username + ", (" + new Date(Date.now()).toUTCString() + "): " + userInput.content.replace(/<@!?(\d+)>/g, '').trim()
              },
              {
                  "type": "image_url",
                  image_url: { url: attachment},
              },
          ],
        })
      } else if (reply) {
        APImessages.push({
          role: "user",
          content: userInput.author.username + ", (" + new Date(Date.now()).toUTCString() + "): " + "replied to [" +  reply.author.username + ", (" + new Date(reply.createdTimestamp).toUTCString() + "): " + reply.content + "] " +  userInput.content.replace(/<@!?(\d+)>/g, '').trim()
        })
        console.log("message is a reply to another user")
      } else {
        APImessages.push({
          role: "user",
          content: userInput.author.username + ", (" + new Date(Date.now()).toUTCString() + "): " + userInput.content.replace(/<@!?(\d+)>/g, '').trim()
        })
        console.log("attachment is not present")
      }
    }
    // console.log(JSON.stringify(chatHistoryArray, null, 2));

  let DBKnowledgeBase = "";       
  Object.keys(keywords).forEach(keyword => {
    if (userInput.content.toLowerCase().includes(keyword.toLowerCase())) {
      console.log(`Found keyword: ${keyword}`);
      console.log(keywords[keyword]);
      DBKnowledgeBase += keyword + ": " + keywords[keyword] + "\n";
    }
  });

  APImessages.push({
    role: "system",
    content: "Keywords found in knowledge base: \n" + DBKnowledgeBase
  })

  const response = await AIclient.chat.completions.create({
    model: "gpt-4.1",
    messages:[...APImessages],
  });
  const output = response.choices[0].message.content;

  // const response = await AIclient.responses.create({
  //     model: "gpt-4.1",
      
  //     input:[...APImessages],
      
  //     // tools: [ { type: "web_search_preview" }],
  //     // tool_choice: "auto"
  // });
  // const output = response.output_text;


  // console.log(output);
  // console.log(APImessages)


    // Append the AI's response to the chat history
    contentToAppend = {
        "username": ""+ client.user.username +"",
        "date": ""+ new Date(Date.now()).toUTCString() +"",
        "message": ""+ output +""
    }
    chatHistoryArray.push(contentToAppend);

    fs.writeFile(userInput.channelId + ".json", JSON.stringify(chatHistoryArray, null, 2), 'utf-8', (err) => {
        if (err) {
            console.error('Failed to write chat history:', err);
        } else {
            console.log('Chat history updated successfully.');
        }
    })
    if (await output.length > 1900) {return "(Response too long, it has been truncated)\n" + output.slice(0, -100);} else {return output;}
}

async function sendDMtoSnek(userInput) {

  // Fetch the user
  const user = await client.users.fetch(snekUserID);

  // Send a DM
  user.send(userInput);
}