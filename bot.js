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
async function changeName(){
        try {
            const server = await MinecraftServer.status(process.env.MCSERVERIP, parseInt(process.env.MCSERVERPORT), { timeout: 10000 } );
            const newUsername = server.motd.clean;
            if (client.user.username !== newUsername) {
                await client.user.setUsername(newUsername);
                console.log("Username set to:", newUsername);
            }
        } catch (error) {
            console.log("Failed to fetch server MOTD or set username:", error.message);
        }
}
async function changeStatus(){
    try {
            const server = await MinecraftServer.status(process.env.MCSERVERIP, parseInt(process.env.MCSERVERPORT), { timeout: 10000 } );
            client.user.setActivity({name: 'ONLINE || Player count: '+server.players.online, type: ActivityType.Custom });           
        } catch (error) {            
            client.user.setActivity({name: 'OFFLINE', type: ActivityType.Custom });
        }
    } 
client.once('ready', () => {
    console.log('Bot is online!');
    changeName();
    setInterval(async () => {
        changeName();
    }, 1000 * 60 * 30); // every 30 minutes (safe for Discord's rate limit)
    changeStatus();
    setInterval(async () => {
        changeStatus();
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
         //interaction.deferReply({ flags: 64});
    if(interaction.isCommand()) {
        const { commandName } = interaction;
        if (commandName === 'serverstatus') {

        try {            
            const server = await MinecraftServer.status(process.env.MCSERVERIP, parseInt(process.env.MCSERVERPORT), { timeout: 10000 } );
             console.log(server);
             await interaction.reply({ content: `Server Status: **ONLINE**\nPlayer Count: **${server.players.online}**`, flags: 64});            
        } catch (error) {  
            console.log(error);
            await interaction.reply({ content: `Server Status: **OFFLINE**\ncode: ${error.code}`, flags: 64});            
        }            
            return;
}}});
client.login(process.env.BOTTOKEN);
