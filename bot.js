require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, ActivityType, SlashCommandBuilder, Partials  } = require('discord.js');
const MinecraftServer = require('minecraft-server-util');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessagePolls,        
    ] ,
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
client.once('ready', () => {
    console.log('Bot is online!');
    setInterval(async () => {
        try {
            const server = await MinecraftServer.status(process.env.MCSERVERIP, parseInt(process.env.MCSERVERPORT));
            const newUsername = server.motd.clean;
            if (client.user.username !== newUsername) {
                await client.user.setUsername(newUsername);
                console.log("Username set to:", newUsername);
            }
        } catch (error) {
            console.log("Failed to fetch server MOTD or set username:", error.message);
        }
    }, 1000 * 60 * 30); // every 30 minutes (safe for Discord's rate limit)
    setInterval(async () => {
        try {
            const server = await MinecraftServer.status(process.env.MCSERVERIP, parseInt(process.env.MCSERVERPORT));
            client.user.setActivity({name: 'ONLINE || Player count: '+server.players.online, type: ActivityType.Custom });           
        } catch (error) {            
            client.user.setActivity({name: 'OFFLINE', type: ActivityType.Custom });
        }
    },1000 * parseInt(process.env.MCSERVERSTATUSUPDATEINTERVAL) || 60000*5); // Default to 5 min if not set
});
const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN);
const commands = [
    new SlashCommandBuilder()
        .setName('serverstatus')
        .setDescription('Get the status of the Minecraft server')
].map(command => command.toJSON());
(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENTID), 
            { body: commands }            
        );
    } catch (error) {
        console.error(error);
    }
})();
client.on('interactionCreate', async (interaction) => {
    if(interaction.isCommand()) {
        const { commandName } = interaction;
        if (commandName === 'serverstatus') {
        try {            
            const server = await MinecraftServer.status(process.env.MCSERVERIP, parseInt(process.env.MCSERVERPORT));
            console.log(server);
            interaction.reply({ content: `Server Status: **ONLINE**\nPlayer Count: **${server.players.online}**`, ephemeral: true });            
        } catch (error) {                        
            interaction.reply({ content: `Server Status: **OFFLINE**\ncode: ${error.code}`, ephemeral: true });            
        }            
            return;
}}});
client.login(process.env.BOTTOKEN);