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

let myUID; // Variable to store the bot's user ID

client.on("ready", () => {
  console.log("I am ready!");
  myUID = client.user.id;
  textToArray(); // Load the chat history from the JSON file
});

client.on("messageCreate", async (message) => {
    // if the author is me, or if it is a bot, ignore it
    if (message.author.bot || message.author.id === myUID) {return;}

    if (message.mentions.has(myUID)) {
        // // Your bot was mentioned in this message
        // if (message.mentions.repliedUser === null) {
        //     mentioned(message);
        // } else {
            mentioned(message);
        // }
    }
});

client.login(token);


async function mentioned(message) {  
    // message.channel.send(`Hey <@${message.author.id}>, you mentioned me?`);
    contentToAppend = {
        "username": ""+ message.author.username +"",
        "date": ""+ new Date(message.createdTimestamp).toDateString() +"",
        "message": ""+ message.content +""
    },
    chatHistoryArray.push(contentToAppend);
    message.channel.send(await queryOpenAI(message));
}

let chatHistoryArray; // Array to store chat history
function textToArray() {
    const data = fs.readFileSync('chatHistory.json', 'utf-8');
    const chatHistory = JSON.parse(data);
    chatHistoryArray = [...chatHistory];
    console.log(chatHistoryArray[0]);
}



const OpenAI = require("openai");
const { time } = require('console');
const AIclient = new OpenAI();

async function queryOpenAI(userInput) {  
    const APImessages = [
        {
            role: "system",
            content: "You are just a normal guy, respond as if you were talking to a casual friend. Your name is Leif. It is fine to be cheerful, but try to avoid the hyperpositive way chatGPT tends to write in. Use the timestamps only to understand when things were said — do not include them in your responses.",
        }
    ]; 

    chatHistoryArray.forEach(element => {
        if (element.username === "Leif") {
            APImessages.push({
                role: "assistant",
                content: element.message,
            })
        } else {
            APImessages.push({
                role: "user",
                content: element.username + ", (" + element.date + ") " + element.message,
            })
        }
    });

    const response = await AIclient.chat.completions.create({
        model: "gpt-4.1-mini",
        
        messages:[...APImessages]
    });

    const output = response.choices[0].message.content;
    console.log(output);

    // Append the AI's response to the chat history
    contentToAppend = {
        "username": ""+ client.user.username +"",
        "date": ""+ new Date(Date.now()).toDateString() +"",
        "message": ""+ output +""
    }
    chatHistoryArray.push(contentToAppend);

    fs.writeFile('chatHistory.json', JSON.stringify(chatHistoryArray, null, 2), 'utf-8', (err) => {
        if (err) {
            console.error('Failed to write chat history:', err);
        } else {
            console.log('Chat history updated successfully.');
        }
    })

    return output;
}