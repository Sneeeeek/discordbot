require('dotenv').config(); // Load environment variables
token = process.env.TOKEN; // Get the token from the environment variables

const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log("I am ready!");
  myUID = client.user.id;
  console.log(myUID)
});

client.on("messageCreate", (message) => {
    // if the author is me, or if it is a bot, ignore it
    if ((message.author.id !== myUID) || !message.author.bot) {

        if (message.mentions.has(myUID)) {
            // Your bot was mentioned in this message
            if (message.mentions.repliedUser === null) {
                mentioned(message);
            } else {
                replied(message);
            }
        }
    }
});

function mentioned(message) {  
    message.channel.send(`Hey <@${message.author.id}>, you mentioned me?`);
}

function replied(message) {  
    message.channel.send(`Hey <@${message.author.id}>, you replied to me?`);
}

client.login(token);