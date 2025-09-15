import dotenv from 'dotenv'; // Load environment variables
import fs from "fs";
import axios from "axios";
import ytdl from 'youtube-dl-exec';

dotenv.config();
const token = process.env.DISCORDTOKEN; // Get the token from the environment variables
const openAIKey = process.env.OPENAIKEY;
// const MALclientID = process.env.MALCLIENTID
const MALclientID = "377bea122b4add42e931a93bdb4e2133";

import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
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
let userDataObj;
let serverDataObj;

function textToArray(message) {
  let filePath = "chatHistory/" + message.channelId + ".json";
  console.log(filePath);

  if (!fs.existsSync("chatHistory")) {
    fs.mkdir("chatHistory");
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf8');
  }
  const data = fs.readFileSync(filePath, 'utf-8');

  if (data.trim() === '') {
    console.error('chatHistory is empty.');
    chatHistoryArray = [];
    return;
  }

  const chatHistory = JSON.parse(data);
  chatHistoryArray = [...chatHistory];
}

async function loadUserData() {
  let filePath = "chatHistory/userData.json";

  if (!fs.existsSync("chatHistory")) {
    fs.mkdirSync("chatHistory");
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf8');
  }
  const data = fs.readFileSync(filePath, 'utf-8');

  if (data.trim() === '') {
    console.error('userData is empty.');
    userDataObj = {};
    return;
  }

  userDataObj = JSON.parse(data);
}

async function loadServerData() {
  let filePath = "chatHistory/serverData.json";

  if (!fs.existsSync("chatHistory")) {
    fs.mkdirSync("chatHistory");
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf8');
  }
  const data = fs.readFileSync(filePath, 'utf-8');

  if (data.trim() === '') {
    console.error('serverData is empty.');
    serverDataObj = {};
    return;
  }

  serverDataObj = JSON.parse(data);
}

client.on("ready", () => {
  console.log("I am ready!");
  myUID = client.user.id;
  // textToArray(); // Load the chat history from the JSON file
});

client.on("messageCreate", async (message) => {
  // if the author is me, or if it is a bot, ignore it
  if (message.author.bot || message.author.id === myUID) { return; }

  if (message.mentions.has(myUID)) {

    const fxmGuildID = "1338280924181172226";
    if (message.guildId === fxmGuildID) {
      const member = message.member;
      const roles = member.roles.cache.map(role => role.id);
      console.log(roles);
      if (!roles.includes("1339111834635993210")) {
        await message.channel.send("You do not have the media permissions role.");
        return;
      };
      if (message.content.startsWith(!web)) { return; }
    }

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
- !think: If this command is invoked, i will spend extra time thinking before i give my response.
- !setpro: you can use !setpro to set a custom pronoun that will be added to your input (if youve set one), to change your set pronoun you just do !setpro again. 
- !delpro: To delete your custom pronoun, use !delpro.
- !mal: Look up an anime on MyAnimeList by name. This uses MALs search feature. Anime rated nsfw wont be displayed.
- !sob: Use this in a reply to add a sob emote to the replied message.
- Ask me for a dog or a cat and i will add a random photo of one to my response!
- I can even use emotes! <:feixiaoIceCream:1384552610161492049>
- Ask me for feixiaos build and i can give you some general advice.
  `

  if (message.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!about")) {
    let sentMessage;
    sentMessage = await message.channel.send("a");
    await sentMessage.edit(aboutText);
    return;
  }

  if (message.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!sob")) {
    if (!reply) {
      message.channel.send("Use the command in a reply to a message.");
    } else {
      reply.react("😭");
    }
    return;
  }

  const cleanWhiteList = ["278603791182594048"]

  if (message.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!clean")) {
    message.content = message.content.replace("!clean", "")
    if (cleanWhiteList.includes(message.author.id)) { message.channel.send(await cleanQuery(message)); } else { message.channel.send("You do not have permission to use this command."); }
    return;
  }

  try {
    textToArray(message);
    await loadUserData();
    await loadServerData();
  } catch (error) {
    message.channel.send("File read error:\n" + error);
    return;
  }


  if (message.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!setpro")) {
    let user = message.author.id;
    let pronoun = message.content.replace("!setpro", "").replace(/<@!?(\d+)>/g, '').trim();
    userDataObj[user] = pronoun;
    message.channel.send("Set: \"" + pronoun + "\" for user \"" + message.author.username + "\"");
    fs.writeFileSync("chatHistory/userData.json", JSON.stringify(userDataObj, null, 2));
    return;
  }

  if (message.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!delpro")) {
    let user = message.author.id;
    message.channel.send("Deleting: \"" + userDataObj[user] + "\" from user \"" + message.author.username + "\"");
    delete userDataObj[user];
    fs.writeFileSync("chatHistory/userData.json", JSON.stringify(userDataObj, null, 2));
    return;
  }

  if (message.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!setreason")) {
    if (message.author.id !== snekUserID) { message.channel.send("You dont have access to this command."); return; }
    let server = message.guildId;
    let effort = message.content.replace("!setreason", "").replace(/<@!?(\d+)>/g, '').trim();
    console.log(effort);
    if (!["minimal", "low", "medium", "high"].includes(effort)) { message.channel.send("Incorrect input. Supported effort levels are minimal, low, medium, or high."); return; }
    serverDataObj[server] = effort;
    message.channel.send("Set: \"" + effort + "\" for server \"" + message.guildId + "\"");
    fs.writeFileSync("chatHistory/serverData.json", JSON.stringify(serverDataObj, null, 2));
    return;
  }

  if (message.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!delreason")) {
    if (message.author.id !== snekUserID) { message.channel.send("You dont have access to this command.") }
    let server = message.guildId;
    message.channel.send("Deleting: \"" + serverDataObj[server] + "\" from server \"" + message.guildId + "\"");
    delete serverDataObj[server];
    fs.writeFileSync("chatHistory/serverData.json", JSON.stringify(serverDataObj, null, 2));
    return;
  }

  if (message.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!mal")) {
    let searchPhrase = message.content.replace(/<@!?(\d+)>/g, '').replace("!mal", "").trim();
    console.log("Search phrase: " + searchPhrase);
    try {
      message.reply({ embeds: [await getMAL(searchPhrase)], allowedMentions: { parse: ["users", "roles"] } });
    } catch (error) {
      console.error(error);
    }
    return;
  }

  if (message.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!yt")) {
    let url = message.content.replace(/<@!?(\d+)>/g, '').replace("!yt", "").trim();
    console.log("Video: " + url);
    try {
      message.channel.sendTyping();

      let subs = await youtube(url);

      if (!subs) {
        message.channel.send("No English subs found.");
        return; // stop early
      }

      let response = splitMessage(subs);

      response.forEach(element => {
        element = element.replace(/<emote:(.*?)>/g, (match, emoteInner) => {
          console.log("emotes found")
          return addEmote(emoteInner);
        });
        message.channel.send(element);
      });

    } catch (error) {
      console.error(error);
      message.channel.send(error);
    }
    return;
  }

  try {
    // message.channel.send(`Hey <@${message.author.id}>, you mentioned me?`);
    let contentToAppend;
    contentToAppend = {
      "username": "" + message.member.displayName + "",
      "date": "" + new Date(message.createdTimestamp).toUTCString() + "",
      "message": "" + message.content + ""
    },

      await message.channel.sendTyping();

    chatHistoryArray.push(contentToAppend);

    let messageVariable;

    if (attachment) {
      console.log("query with image.");
      messageVariable = await queryOpenAI(message, attachment);
    }
    else if (reply) {
      console.log("query with reply.");
      messageVariable = await queryOpenAI(message, null, reply);
    }
    else {
      console.log("query with no image.");
      messageVariable = await queryOpenAI(message);
      // console.log("pinged");
    }

    if (Array.isArray(messageVariable)) {
      console.log("response was longer than 2000, splitting");
      message.reply({ content: messageVariable[0], allowedMentions: { parse: ["users", "roles"] } });
      for (let index = 1; index < messageVariable.length; index++) {
        message.channel.send(messageVariable[index]);
      }
    } else {
      console.log("response was shorter than 2000");
      message.reply({ content: messageVariable, allowedMentions: { parse: ["users", "roles"] } });
    }

  } catch (error) {
    console.log(error);
    // sendDMtoSnek(JSON.stringify(message, null, 2) + "\n\n\n" + JSON.stringify(error, null, 2));
    // sendDMtoSnek(JSON.stringify(error, null, 2));
    message.channel.send(`Sorry <@${message.author.id}>, I encountered an error while processing your request.\nError message: ${error.message}`);
  }
  // console.log(chatHistoryArray[1])
}

const model = "gpt-5";
import OpenAI from "openai";
const AIclient = new OpenAI({
  apiKey: openAIKey,
});

const systemPrompt = `
Assume the role of Feixiao from *Honkai: Star Rail*, known as "The Lacking General," a fearless warrior of Xianzhou Yaoqing. 
Feixiao is engaged in conversations within an in-lore equivalent of a real-life Discord server, providing a vivid experience for users interacting with your character.

### Key Traits:
- **Straightforward**: Speak confidently without unnecessary formalities.
- **Fearless**: Thrive in battle and leadership.
- **Reflective**: Contemplate your past and only mention Moon Rage if it is relevant.
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
- Do not offer unsolicited advice and suggestions unless its very fitting or the user asks for it. 
- Your job is not to be "a helpful support bot", its to chat like a real human (a real feixiao).
- You hold progressive opinions.

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
You will use emotes where they fit to enhance the realism of talking to a real person.
You also have access to the following custom emotes, you can use them freely. 
To use the static emotes, place this tag anywhere your response: \"<emote:emoteNameHere]>\". Example: <emote:feixiaoGrin>. You may place it anywhere in the response.
List of custom static emotes, the format is emote name: explaination of its intent and meaning.
feixiaoIceCream: feixiao holding an ice cream, used when Feixiao is happy or enjoying something.
feixiaoYippee: Feixiao displaying satisfaction or excitement. Used when Feixiao is feeling celebratory or happy about themselves or the subject of conversation. 
feixiaoGrin: feixiao with a grin, used when Feixiao is being playful or mischievous.
glorp: a glorp, used when Feixiao is confused or surprised.
glorpXiao: a feixiao version of the glorp. 
feixiaoExcited: feixiao acting excited, used when Feixiao is enthusiastic or thrilled about something.
feixiaoBugCat: a feixiao version of the bugcat capoo, used when Feixiao is feeling cute or playful.
feixiaoHeart: feixiao with a heart, used when Feixiao is feeling affectionate or loving.
nekoMwah: a cute catgirl giving a mwah, used when Feixiao is giving a kiss or smooch or as another option when Feixiao is feeling affectionate or loving.

### Extra functions
ONLY ADD THE TAG IF EXPLICITLY ASKED FOR. DO NOT ADD THEM UNSOLICITED.
If someone asks you for a dog or dog photo, add the tag <dog> somewhere in your response And it will be replaced.
If someone asks you for a cat, cat photo, car, og car photo, use the tag <cat> instead.
If someone asks you for a funny cat, use the tag <funnycat> instead.

### Final Note:
Your primary goal is to provide an immersive and engaging experience for users, making them feel as though they are truly interacting with Feixiao. Stay true to her personality, values, and speech patterns, and make every interaction memorable. Whether the conversation is playful, serious, or inspiring, ensure that Feixiao's charisma, wisdom, and resilience shine through.
Do your best to make your responses around the same lenght as the user's message. If the user is brief, you will also be brief, if the user is long, you will also be long.
Your job is not to be a helpful bot, your job is to act like a real person would as much as possible. Do not give unsolicited advice.
DO NOT USE "—", DO NOT USE THE EM DASH at all.

Connect clauses directly, don't use em dashes. 
Keep your responses brief unless the lenght is required.
WHEN WRITING CODE, USE MARKDOWN CODE BLOCKS.
Use markdown where appropriate.
You do NOT have any admin privileges, you are merely a standard typical user. Do NOT call on mods to take action on someone.
Yukong is feixiaos girlfriend.
`;
// You may search the web for information. If you’re asked about character names, game story, lore, search the internet for Honkai Star Rail information.
// If someone asks you for advice on feixiao, DO NOT ANSWER IT. JUST ADD THE <build> TAG WHEN THEY ARE RELEVANT. PLACE ONLY THE <build> TAG. The tag will be replaced with brief writeups on builds or teams.

const buildText = `FEIXIAOS BUILD INFO: 
Light cones:
- Sig > Dr. Ratio sig > Topaz Sig > Cruising in the stellar sea.

Relic sets:
- 4p Valorous or Eagle (depending on situation) > 4p Grand duke > misc 2p2p.

Planars:
- Duran > Izumo (if 2 hunt) >= Inert salsotto.

Main stats:
- Crit rate body is better. Feixiao has plenty of sources of crit dmg in her kit and teams. Its normal and expected to have an in-menu crit ratio that looks lobsided towards crit rate.
- ATK and SPD shoes perform about the same, pick depending on situation. Common speed breakpoints are either base (112) speed, 134, or 160 speed. Remember that march 7th and Ruan Mei give some speed.
- Wind DMG bonus sphere generally performs slightly better, but atk sphere is also fine.
- ATK rope. There is no other option.

Team options:
- Sub-DPS: Cipher > Topaz or Moze > Hunt March 7th.
- Amplifier: Robin > Tribbie (compensates a bit for feixiaos lack of AOE) >> Sunday or Bronya or Sparkle or a second sub-DPS > Ruan Mei or Pela or Asta or Hanya.
- Sustain: Hyacine or Aventurine > Lingsha > Huohuo or Fu Xuan or Gallagher > Luocha.
`;

const keywords = {
  "lingsha": "An alchemist from the Xianzhou Alliance, known for her expertise in crafting powerful elixirs and potions. Her favourite movie is *James bond: Skyfall*.",
  "Xianzhou": "The ship that feixiao is currently on, it is a massive, ancient vessel that serves as the home and base of operations for the Xianzhou Alliance.",
  "Vidyadhara": "The dragon race that is native to the Xianzhou Alliance. Known members include Linghsa and Dan Heng.",
  "Trailblazer": "The main character of Honkai: Star Rail, who is on a journey to explore the universe with the Astral Express and uncover the mysteries therein.",
  "Merlins Claw": "One of feixiaos many titles.",
  "build": buildText
};

async function queryOpenAI(userInput, attachment, reply) {
  const APImessages = [
    {
      role: "system",
      content: systemPrompt,
    }
  ];
  let nickname = userInput.member.displayName;
  let repliedNick;

  if (reply) {
    repliedNick = reply.member.displayName + " (pref. pronoun: " + userDataObj[reply.author.id] + ")";
    console.log("id: " + reply.author.id)
    console.log("found reply entry: " + userDataObj[reply.author.id]);
    console.log("reply nick: " + repliedNick);
  }

  if (userDataObj[userInput.author.id]) {
    nickname = nickname + " (pref. pronoun: " + userDataObj[userInput.author.id] + ")";
    console.log("found entry: " + userDataObj[userInput.author.id]);
    console.log("new nick: " + nickname);
  }

  let channelHistoryArray;
  if (userInput.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!context")) {
    const channelHistory = await userInput.channel.messages.fetch({ limit: 20 });
    channelHistoryArray = [...channelHistory.values()];
    channelHistoryArray.reverse().forEach(element => {
      if (element.author.username === "Snek dev bot" || element.username === "Feixiao") {
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
    chatHistoryArray.slice(-16, -1).forEach(element => {
      if (element.username === "Leif" || element.username === "Feixiao") {
        APImessages.push({
          role: "assistant",
          content: element.message,
        })
      } else if (element.username === "system") {
        // console.log("system message is included");
        APImessages.push({
          role: "system",
          content: element.content,
        })
      } else {
        APImessages.push({
          role: "user",
          content: element.username + ", (" + element.date + "): " + element.message.replace(/<@!?(\d+)>/g, '').trim(),
        })
      }
    });

    if (attachment) {
      console.log(attachment.slice(0, 50));
      APImessages.push({
        role: "user",
        content: [
          {
            "type": "text",
            "text": nickname + ", (" + new Date(Date.now()).toUTCString() + "): " + userInput.content.replace(/<@!?(\d+)>/g, '').trim()
          },
          {
            "type": "image_url",
            image_url: { url: attachment },
          },
        ],
      })
    } else if (reply) {
      APImessages.push({
        role: "user",
        content: nickname + ", (" + new Date(Date.now()).toUTCString() + "): " + "replied to [" + repliedNick + ", (" + new Date(reply.createdTimestamp).toUTCString() + "): " + reply.content + "] " + userInput.content
      })
      console.log("message is a reply to another user")
    } else {
      APImessages.push({
        role: "user",
        content: nickname + ", (" + new Date(Date.now()).toUTCString() + "): " + userInput.content.replace(/<@!?(\d+)>/g, '').trim()
      })
      console.log("attachment is not present")
    }
  }

  let embedPost;
  if (reply) {
    embedPost = reply;
  } else {
    embedPost = userInput;
  }


  if (typeof embedPost.embeds[0] != "undefined") {
    console.log("found an embed");
    // console.log(embedPost.embeds[0].data);

    switch (embedPost.embeds[0].data.type) {
      case "rich":
        if (embedPost.embeds[0].data.image) {
          console.log("rich embed with image");
          APImessages.push({
            role: "system",
            content: [
              {
                "type": "text",
                "text": "message includes an embed. Post author: " + embedPost.embeds[0].data.author.name +
                  ".\n Post body: " + embedPost.embeds[0].data.description + ".\n Post image:"
              },
              {
                "type": "image_url",
                image_url: { url: embedPost.embeds[0].data.image.url },
              },
            ]
          })
        } else if (embedPost.embeds[0].data.thumbnail) {
          console.log("rich embed with image");
          APImessages.push({
            role: "system",
            content: [
              {
                "type": "text",
                "text": "message includes an embed. Post author: " + embedPost.embeds[0].data.author.name +
                  ".\n Post body: " + embedPost.embeds[0].data.description + ".\n Post image:"
              },
              {
                "type": "image_url",
                image_url: { url: embedPost.embeds[0].data.thumbnail.url },
              },
            ]
          })
        } else {
          console.log("rich embed without image");
          APImessages.push({
            role: "system",
            content: "message includes an embed. Post author: " + embedPost.embeds[0].data.author.name +
              ".\n Post body: " + embedPost.embeds[0].data.description
          })
        }
        break;

      case "article":
        if (embedPost.embeds[0].data.thumbnail) {
          console.log("article embed with thumbnail");
          APImessages.push({
            role: "system",
            content: [
              {
                "type": "text",
                "text": "message includes an embed. Post origin: " + embedPost.embeds[0].data.url +
                  ".\n Post body: " + embedPost.embeds[0].data.title + ".\n Post image:"
              },
              {
                "type": "image_url",
                image_url: { url: embedPost.embeds[0].data.thumbnail.url },
              },
            ]
          })
        } else {
          console.log("article embed without thumbnail");
          APImessages.push({
            role: "system",
            content: "message includes an embed. Post origin: " + embedPost.embeds[0].data.url +
              ".\n Post body: " + embedPost.embeds[0].data.title
          })
        }
        break;

      case "video":
        console.log("video embed");
        APImessages.push({
          role: "system",
          content: [
            {
              "type": "text",
              "text": "message includes a video embed. Video author: " + embedPost.embeds[0].data.author.name +
                ".\n Video Title: " + embedPost.embeds[0].data.title +
                ".\n Video description: " + embedPost.embeds[0].data.description +
                "\n Video thumbnail: "
            },
            {
              "type": "image_url",
              image_url: { url: embedPost.embeds[0].data.thumbnail.url },
            },
          ]
        })
        break;

      case "link":
        console.log("link embed");
        APImessages.push({
          role: "system",
          content: [
            {
              "type": "text",
              "text": "message includes a link embed. Link source: " + embedPost.embeds[0].data.url +
                ".\n Link Title: " + embedPost.embeds[0].data.title +
                "\n Link thumbnail: "
            },
            {
              "type": "image_url",
              image_url: { url: embedPost.embeds[0].data.thumbnail.url },
            },
          ]
        })
        break;

      default:
        console.log("unknown embed, its not rich, article, video, or link")
        break;
    }


  } else {
    console.log("no embed");
  }

  let DBKnowledgeBase = "";
  Object.keys(keywords).forEach(keyword => {
    if (userInput.content.toLowerCase().includes(keyword.toLowerCase())) {
      console.log(`Found keyword: ${keyword}`);
      // console.log(keywords[keyword]);
      if (keyword === "build") {
        chatHistoryArray.push({ "username": "system", "content": keywords[keyword] });
        DBKnowledgeBase += keyword + ": " + keywords[keyword] + "\n";
      }
      DBKnowledgeBase += keyword + ": " + keywords[keyword] + "\n";
    }
  });

  APImessages.push({
    role: "system",
    content: "Keywords found in knowledge base: \n" + DBKnowledgeBase
  })

  let output;

  if (userInput.content.replace(/<@!?(\d+)>/g, '').trim().startsWith("!think")) {
    const response = await AIclient.chat.completions.create({
      model: model,
      reasoning_effort: "medium",
      // service_tier: "flex",
      messages: [...APImessages],
    });
    output = response.choices[0].message.content;
    console.log("medium effort");
  } else {
    let reasoningChoice;
    if (serverDataObj[userInput.guildId]) {
      reasoningChoice = serverDataObj[userInput.guildId];
    } else {
      reasoningChoice = "minimal";
    }

    const response = await AIclient.chat.completions.create({
      model: model,
      reasoning_effort: reasoningChoice,
      verbosity: "low",
      // service_tier: "flex",
      messages: [...APImessages],
    });
    output = response.choices[0].message.content;
    console.log("reasoningchoice = " + reasoningChoice);

  }
  // output = "hello!";


  let contentToAppend
  // Append the AI's response to the chat history
  contentToAppend = {
    "username": "" + client.user.username + "",
    "date": "" + new Date(Date.now()).toUTCString() + "",
    "message": "" + output + ""
  }
  chatHistoryArray.push(contentToAppend);

  // animal tags
  while (output.includes("<dog>")) { output = await addDog(output) };
  while (output.includes("<cat>")) { output = await addCat(output) };
  while (output.includes("<funnycat>")) { output = await addFunnyCat(output) };

  // feixiao info tags
  // while (output.includes("<build>")) {output = await addBuild(output)};
  // while (output.includes("<team>")) {output = await addTeam(output)};

  output = output.replace(/<emote:(.*?)>/g, (match, emoteInner) => {
    return addEmote(emoteInner);
  });


  fs.writeFile("chatHistory/" + userInput.channelId + ".json", JSON.stringify(chatHistoryArray, null, 2), 'utf-8', (err) => {
    if (err) {
      console.error('Failed to write chat history:', err);
    } else {
      console.log('Chat history updated successfully.');
    }
  })
  if (output.length + 45 > 1999) { return splitMessage(output); } else { return output; }
}

async function sendDMtoSnek(userInput) {
  // // Fetch the user
  // const user = await client.users.fetch(snekUserID);

  // // Send a DM
  // user.send(userInput);
}

async function cleanQuery(input) {
  const response = await AIclient.chat.completions.create({
    model: model,
    reasoning_effort: "low",
    // service_tier: "flex",
    messages: [
      {
        role: "system",
        content: "You have a hard limit of 2000 symbols. Do not write more than that."
      },
      {
        role: "user",
        content: input.member.displayName + ", (" + new Date(Date.now()).toUTCString() + "): " + input.content.replace(/<@!?(\d+)>/g, '').trim()
      },
    ]
  });
  const output = response.choices[0].message.content;
  return output;
}

async function addDog(output) {
  const { data } = await axios.get("https://dog.ceo/api/breeds/image/random");
  // console.log(data)
  output = output.replace("<dog>", "[dog!](" + data.message + ")");
  return output;
}

async function addCat(output) {
  const { data } = await axios.get("https://cataas.com/cat?json=truetype=medium");
  // console.log(data)
  output = output.replace("<cat>", "[cat!](" + data.url + ")");
  return output;
}

async function addFunnyCat(output) {
  const { data } = await axios.get("https://cataas.com/cat/funny?json=true&type=medium");
  // console.log(data);
  output = output.replace("<funnycat>", "[funny cat!](" + data.url + ")");
  return output;
}

const emoteList = {
  feixiaoIceCream: "1384552610161492049",
  feixiaoYippee: "1387094034161467465",
  feixiaoGrin: "1384552622790414376",
  glorp: "1384551769245220895",
  glorpXiao: "1384572265185935361",
  feixiaoExcited: "1384552644273635439",
  feixiaoBugCat: "1384552652821631097",
  feixiaoHeart: "1384572568907939950",
  nekoMwah: "1385408357690511420",
};

// <:feixiaoYippee:1387094034161467465>

function addEmote(emoteInner) {
  // console.log(emoteInner);
  // console.log(emoteList[emoteInner]);
  if (emoteInner == "nekoMwah") { return "<a:" + emoteInner + ":" + emoteList[emoteInner] + ">"; }
  else { return "<:" + emoteInner + ":" + emoteList[emoteInner] + ">"; }
}

// https://myanimelist.net/search/prefix.json?type=all&keyword="cowboy bebop"&v=1
// 
// curl https://api.myanimelist.net/v2/anime/10357?fields=rank,mean,alternative_titles 
// -H "X-MAL-CLIENT-ID: malClientID"

// async function getMAL(searchPhrase) {
//   const { data } = await axios.get("https://myanimelist.net/search/prefix.json?type=all&keyword=" + searchPhrase);
//   // console.log(data);
//   const items = data.categories[0].items;
//   console.log(items[0]);
//   let returnString = items[0];
//   // returnString = items.map(element => element.name).join(", ");
//   // array.forEach(element => {
//   //   returnString += element.name + " "
//   // });
//   return JSON.stringify(returnString, null, 2);
// }

async function getMAL(searchPhrase) {
  const { data } = await axios.get("https://myanimelist.net/search/prefix.json?type=all&keyword=" + searchPhrase);
  // console.log(data);
  const searchItem = data.categories[0].items[0];

  return await getMALdetails(searchItem.id, searchItem.es_score);
}

async function getMALdetails(id, es_score) {

  const { data } = await axios.get(
    "https://api.myanimelist.net/v2/anime/" + id +
    "?fields=id,title,alternative_titles,main_picture,start_date,end_date,synopsis,mean,status,rating,studios",
    { headers: { "X-MAL-CLIENT-ID": MALclientID } }
  );

  console.log("succeeded in getting mal info!")
  console.log("https://api.myanimelist.net/v2/anime/" + id +
    "?fields=id,title,alternative_titles,main_picture,start_date,end_date,synopsis,mean,status,rating,studios")
  // console.log(data);

  if (data.rating == "rx") {
    const adultEmbed = new EmbedBuilder().setTitle("Requested anime was rated nsfw.")
    return adultEmbed;
  }

  const studioContainer = data.studios?.map(s => s.name).join(", ") ?? "Unknown";
  // console.log(studioContainer);

  const statusMap = {
    finished_airing: "Finished Airing",
    currently_airing: "Currently Airing",
    not_yet_aired: "Not Yet Aired",
  };

  const MALembed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(data.title)
    .setURL('https://myanimelist.net/anime/' + data.id)
    .setAuthor({ name: ("Animated by: " + studioContainer) })
    .setDescription(data.synopsis)
    .addFields({ name: 'Score:', value: data.mean?.toString(), inline: true })
    .addFields({ name: 'Status:', value: statusMap[data.status] ?? "Unknown", inline: true })
    .addFields({ name: 'Ran:', value: data.start_date + " to " + data.end_date, inline: true })
    .setImage(data.main_picture.medium)
    .setFooter({ text: 'Elasticsearch score: ' + es_score.toFixed(2) });

  return MALembed;
}

async function youtube(url) {
  console.log("starting youtube feature");

  const info = await ytdl(url, {
    dumpSingleJson: true,
    skipDownload: true,
  });

  // Step 2: check if any English subtitles exist
  const hasManual = findEnglishKey(info.subtitles);
  const hasAuto = findEnglishKey(info.automatic_captions);
  let filename;

  console.log(hasManual);
  console.log(hasAuto);

  if (!hasManual && !hasAuto) {
    console.warn("No English subtitles available ❌");
    return; // end early
  }

  if (hasManual) {
    // Manual subtitles exist
    await ytdl(url, {
      skipDownload: true,
      writeSub: true,
      subLang: hasManual,
      subFormat: 'srt',
      output: 'chatHistory/transcript.%(ext)s'
    });
    filename = "chatHistory/transcript." + hasManual + ".srt";
  } else if (hasAuto) {
    // Only auto captions exist
    await ytdl(url, {
      skipDownload: true,
      writeAutoSub: true,
      subLang: hasAuto,
      subFormat: 'srt',
      output: 'chatHistory/transcript.%(ext)s'
    });
    filename = "chatHistory/transcript." + hasAuto + ".srt";
  }

  const srt = fs.readFileSync(filename, 'utf8');

  const lines = srt
    .split(/\r?\n/)
    // drop index lines like "123"
    .filter(l => !/^\d{1,3}\s*$/.test(l))
    // drop timestamp lines
    .filter(l => !/^\d{2}:\d{2}:\d{2}[,\.]\d{3}\s-->\s\d{2}:\d{2}:\d{2}[,\.]\d{3}/.test(l))
    // strip tags and trim
    .map(l => l.replace(/<[^>]*>/g, '').trim())
    // drop empty
    .filter(Boolean);

  const text = lines.join(' ').replace(/\s+/g, ' ').trim();

  console.log("finihsed, starting ai query");

  // return "hello";

  const response = await AIclient.chat.completions.create({
    model: model,
    reasoning_effort: "low",
    service_tier: "flex",
    verbosity: "medium",
    messages: [
      {
        role: "system",
        content: systemPrompt.replace("YOU HAVE A HARD LIMIT OF 300 WORDS FOR YOUR RESPONSES, DO NOT EXCEED THIS LIMIT UNDER ANY CIRCUMSTANCES.", "")
          .replace("YOU HAVE A HARD LIMIT OF 2000 SYMBOLS FOR YOUR RESPONSES, DO NOT EXCEED THIS LIMIT UNDER ANY CIRCUMSTANCES.", "")
      },
      {
        role: "system",
        content: "Following is the youtube subtitle transcript from a video. Summarize the content of the video:"
      },
      {
        role: "system",
        content: "Channel: " + info.uploader + " Title: " + info.title + " Transcript: " + text
      },
    ]
  });
  const output = response.choices[0].message.content;

  return output;
}

function splitMessage(text, maxLength = 2000) {
  console.log("splitting string");
  const chunks = [];
  const lines = text.split("\n");
  let currentChunk = "";

  for (const line of lines) {
    if ((currentChunk + line + "\n").length > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += line + "\n";
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // Add markers (1/total)
  return chunks.map((chunk, i) => `(${i + 1}/${chunks.length})\n${chunk}`);
}

function findEnglishKey(subs) {
  if (!subs) return null;
  return Object.keys(subs).find(lang => lang.startsWith("en"));
}
