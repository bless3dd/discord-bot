const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = [
    {
        data: new SlashCommandBuilder()
            .setName('poll')
            .setDescription('Crea un sondaggio')
            .addStringOption(option =>
                option.setName('domanda')
                    .setDescription('La domanda del sondaggio')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('opzioni')
                    .setDescription('Opzioni separate da virgola (max 10)')
                    .setRequired(true)),

        async execute(interaction) {
            const question = interaction.options.getString('domanda');
            const options = interaction.options.getString('opzioni').split(',').map(opt => opt.trim()).slice(0, 10);

            if (options.length < 2) {
                return interaction.reply({ content: '❌ Servono almeno 2 opzioni!', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📊 Sondaggio')
                .setDescription(question)
                .addFields(options.map((opt, i) => ({ name: `${i + 1}️⃣`, value: opt, inline: true })))
                .setFooter({ text: `Sondaggio di ${interaction.user.tag}` });

            const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            for (let i = 0; i < options.length; i++) {
                await msg.react(emojis[i]);
            }
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('8ball')
            .setDescription('Chiedi alla palla magica 8')
            .addStringOption(option =>
                option.setName('domanda')
                    .setDescription('La tua domanda')
                    .setRequired(true)),

        async execute(interaction) {
            const question = interaction.options.getString('domanda');
            const answers = [
                '✅ Sì', '❌ No', '🤔 Forse', '🎯 Certamente',
                '⛔ Assolutamente no', '🔮 Riprova più tardi',
                '💯 Sicuramente', '❓ Non posso prevederlo',
                '✨ Molto probabile', '🚫 Non ci contare'
            ];

            const answer = answers[Math.floor(Math.random() * answers.length)];

            const embed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle('🎱 Palla Magica 8')
                .addFields(
                    { name: 'Domanda', value: question },
                    { name: 'Risposta', value: answer }
                );

            await interaction.reply({ embeds: [embed] });
        }
    },

    {
        data: new SlashCommandBuilder()
            .setName('say')
            .setDescription('Fai dire qualcosa al bot')
            .addStringOption(option =>
                option.setName('messaggio')
                    .setDescription('Il messaggio da inviare')
                    .setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ content: '❌ Non hai i permessi!', ephemeral: true });
            }

            const message = interaction.options.getString('messaggio');
            await interaction.channel.send(message);
            await interaction.reply({ content: '✅ Messaggio inviato!', ephemeral: true });
        }
    }
];