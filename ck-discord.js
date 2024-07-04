const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const axios = require('axios');


const whitelist = ['1190736517153423424', '1190736509419126946'];

const token = 'MTE5MzY4NzE3OTgzNTIyODE4MA.GX0bqX.H6TLq09wjCzabUkDTmwl_ebkOOijt6LSL3p_aA';
const clientId = '1193687179835228180';
const guildId = '1190775346874810398';

const commands = [
  {
    name: 'adduser',
    description: 'Example | username: password: expiry: 25/12/23', //year/month/day
    type: 1,
    options: [
      {
        name: 'username',
        description: 'test',
        type: 3,
        required: true,
      },
      {
        name: 'password',
        description: 'test',
        type: 3,
        required: true,
      },
      {
        name: 'expiry',
        description: 'test',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'deleteuser',
    description: 'Example | username: test', //year/month/day
    type: 1,
    options: [
      {
        name: 'username',
        description: 'test',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'compuser',
    description: 'Example | username: test',
    type: 1,
    options: [
      {
        name: 'username',
        description: 'test',
        type: 3,
        required: true,
      },
      {
        name: 'days',
        description: '1 day ykyk',
        type: 4,
        required: true,
      },
    ],
  },
  {
    name: 'instructions',
    description: 'Get detailed instructions for using the service',
    type: 1
  },
];

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing (/)');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('Successfully reloaded (/)');
  } catch (error) {
    console.error(error);
  }
})();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Connection'] = 'keep-alive';
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';
axios.defaults.headers.common['cookie'] = 's1_s_cc=f7066751726ff0cd052d6300a76fea93f68e243a64ffc8a8dd3dcd6ee263027b; connect.sid=s%3AlJRdSQPU2GDsgzdE8SXy-ga7l1wK_Y1H.T9gYl9X0cIR3fuD1bLcdvRBqk73mCh9miiH4kQXUHfo';

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;


  const allowedUser = whitelist.includes(interaction.user.id);
  if (!allowedUser) {
    return interaction.reply({
      content: 'You are not authorized to use this command.',
      ephemeral: true, 
    });
  }

  const { commandName, options } = interaction;



  if (commandName === 'adduser') {
    const username = options.getString('username');
    const password = options.getString('password');
    const expiry = options.getString('expiry');

    const discordLink = "https://discord.gg/cordx";
    const telegramLink = "https://t.me/cordkill";

    try {

      const response = await axios.get(
        `https://cordkiller.com/api/users?action=adduser&username=${username}&password=${password}&expiry=${expiry}`
      );
      console.log('API Response:', response.data);

      // Enhanced embed with better visuals
      const embed = new EmbedBuilder()
        .setColor('#00BFFF') // A more vibrant color
        .setTitle('User Created Successfully!')
        .setDescription('A new user account has been created with the following details:')
        .addFields(
          { name: ' Username', value: username, inline: true },
          { name: ' Password', value: password, inline: true },
          { name: ' Expiry Date', value: expiry, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `Discord: ${discordLink} | Telegram: ${telegramLink}` });

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error making API request:', error);
      interaction.reply('❌ Failed to create user. Please try again.');
    }
}
  else if (commandName === 'compuser') {
    const username = options.getString('username');
    const days = options.getInteger('days');

    try {
      const response = await axios.get(
        `https://cordkiller.com/api/users?action=compuser&username=${username}&days=${days}`
      );
      console.log('API Response:', response.data);
      interaction.reply(`User compensated with ${days} days successfully!`);
    } catch (error) {
      console.error('Error making API request:', error);
      interaction.reply('Failed to compensate user. Please try again.');
    }
  }
  else if (commandName === 'instructions') {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Instructions for Using the Service')
      .addFields(
        { name: '1. Access the Website', value: 'Open your preferred browser and head to the website.' },
        { name: '2. Login to Your Account', value: 'Locate the login section and enter your Discord credentials. Click "Login" to access your account.' },
        { name: '3. Enable Developer Mode', value: 'Go to Discord settings > Appearance > Enable Developer Mode.' },
        { name: '4. Navigate to User Search', value: 'Locate the user search feature, usually found in the member list or server search bar.' },
        { name: '5. Enter User\'s Discord ID', value: 'Obtain the Discord user ID of the person you\'re searching for and input it into the search bar.' },
        { name: 'Note', value: 'Remember to enable Developer Mode in Discord settings to obtain user IDs. If you encounter any issues, refer to Discord\'s documentation or contact their support for assistance.' }
      )
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

client.login(token);
