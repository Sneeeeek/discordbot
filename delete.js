// package.json deps: "discord.js": "^14"
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();
const token = process.env.LIVETOKEN;
const channelId = '123';
const messageId = '123';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
  try {
    const channel = await client.channels.fetch(channelId);
    const msg = await channel.messages.fetch(messageId);
    await msg.edit("text here");
    // await msg.delete();
    console.log('Deleted');
  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await client.destroy();
    process.exit(0);
  }
});

client.login(token);