const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

// ========================================
// NEON • GANG BATTLE WHEEL
// ========================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// بيانات كل سيرفر
const games = new Map();

// ========================================
// GAME
// ========================================

function getGame(guildId) {
  if (!games.has(guildId)) {
    games.set(guildId, {
      gangs: [],
      originalGangs: [],
      firstGang: null
    });
  }

  return games.get(guildId);
}

// ========================================
// OWNER CHECK
// ========================================

function isOwner(interaction) {
  return (
    interaction.guild &&
    interaction.user.id === interaction.guild.ownerId
  );
}

// ========================================
// XML ESCAPE
// ========================================

function escapeXML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ========================================
// PROFESSIONAL NEON WHEEL
// ========================================

function createWheelSVG(
  gangs,
  title = "NEON • GANG BATTLE"
) {

  const width = 800;
  const height = 800;

  const cx = 400;
  const cy = 410;

  const r = 300;

  // ======================================
  // EMPTY WHEEL
  // ======================================

  if (!gangs.length) {

    return `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}"
     height="${height}">

  <defs>

    <radialGradient id="emptyBg">
      <stop offset="0%" stop-color="#252525"/>
      <stop offset="55%" stop-color="#0b0b0b"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>

    <filter id="emptyGlow">
      <feGaussianBlur stdDeviation="8"/>
    </filter>

  </defs>

  <rect
    width="100%"
    height="100%"
    fill="url(#emptyBg)"
  />

  <circle
    cx="400"
    cy="410"
    r="315"
    fill="none"
    stroke="#ff2020"
    stroke-width="15"
    opacity="0.4"
    filter="url(#emptyGlow)"
  />

  <circle
    cx="400"
    cy="410"
    r="305"
    fill="#050505"
    stroke="#ffffff"
    stroke-width="5"
  />

  <text
    x="400"
    y="380"
    text-anchor="middle"
    fill="#ffffff"
    font-size="50"
    font-family="Arial"
    font-weight="900"
    letter-spacing="5">
    NEON
  </text>

  <text
    x="400"
    y="425"
    text-anchor="middle"
    fill="#ff2020"
    font-size="25"
    font-family="Arial"
    font-weight="bold"
    letter-spacing="2">
    GANG BATTLE
  </text>

  <text
    x="400"
    y="470"
    text-anchor="middle"
    fill="#ffffff"
    opacity="0.65"
    font-size="18"
    font-family="Arial">
    أضف أسماء العصابات للبدء
  </text>

</svg>`;
  }

  // ======================================
  // COLORS
  // ======================================

  const colors = [
    "#080808",
    "#e50914",
    "#ffffff",
    "#151515",
    "#b00000",
    "#eeeeee"
  ];

  const angle = 360 / gangs.length;

  function polar(deg, radius = r) {

    const rad =
      (deg - 90) * Math.PI / 180;

    return {
      x:
        cx +
        radius *
        Math.cos(rad),

      y:
        cy +
        radius *
        Math.sin(rad)
    };
  }

  let slices = "";

  // ======================================
  // DRAW GANGS
  // ======================================

  gangs.forEach((gang, index) => {

    const startAngle =
      index * angle;

    const endAngle =
      startAngle + angle;

    const start =
      polar(startAngle);

    const end =
      polar(endAngle);

    const largeArc =
      angle > 180 ? 1 : 0;

    const color =
      colors[index % colors.length];

    // قطاع
    slices += `
      <path
        d="
          M ${cx} ${cy}
          L ${start.x} ${start.y}
          A ${r} ${r}
          0 ${largeArc} 1
          ${end.x} ${end.y}
          Z
        "
        fill="${color}"
        stroke="#ffffff"
        stroke-width="3"
      />
    `;

    // اسم العصابة
    const middleAngle =
      startAngle + angle / 2;

    const textPosition =
      polar(
        middleAngle,
        r * 0.67
      );

    let fontSize = 23;

    if (gang.length > 16) {
      fontSize = 15;
    }
    else if (gang.length > 12) {
      fontSize = 18;
    }
    else if (gang.length > 9) {
      fontSize = 20;
    }

    const textColor =
      color === "#ffffff" ||
      color === "#eeeeee"
        ? "#000000"
        : "#ffffff";

    slices += `
      <text
        x="${textPosition.x}"
        y="${textPosition.y}"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${textColor}"
        font-size="${fontSize}"
        font-family="Arial"
        font-weight="900"
        transform="
          rotate(
            ${middleAngle}
            ${textPosition.x}
            ${textPosition.y}
          )
        ">
        ${escapeXML(gang)}
      </text>
    `;
  });

  // ======================================
  // SVG
  // ======================================

  return `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}"
     height="${height}">

  <defs>

    <radialGradient id="background">
      <stop offset="0%" stop-color="#252525"/>
      <stop offset="50%" stop-color="#0b0b0b"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>

    <filter
      id="redGlow"
      x="-50%"
      y="-50%"
      width="200%"
      height="200%">

      <feGaussianBlur
        stdDeviation="8"
        result="blur"/>

      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>

    </filter>

    <filter id="shadow">

      <feDropShadow
        dx="0"
        dy="8"
        stdDeviation="10"
        flood-color="#000000"
        flood-opacity="0.9"/>

    </filter>

  </defs>

  <!-- BACKGROUND -->

  <rect
    width="100%"
    height="100%"
    fill="url(#background)"
  />

  <!-- HEADER -->

  <text
    x="400"
    y="48"
    text-anchor="middle"
    fill="#ffffff"
    font-size="30"
    font-family="Arial"
    font-weight="900"
    letter-spacing="4">
    NEON
  </text>

  <text
    x="400"
    y="77"
    text-anchor="middle"
    fill="#ff2020"
    font-size="15"
    font-family="Arial"
    font-weight="bold"
    letter-spacing="3">
    GANG BATTLE
  </text>

  <!-- RED GLOW -->

  <circle
    cx="400"
    cy="410"
    r="318"
    fill="none"
    stroke="#ff2020"
    stroke-width="16"
    opacity="0.4"
    filter="url(#redGlow)"
  />

  <!-- OUTER FRAME -->

  <circle
    cx="400"
    cy="410"
    r="312"
    fill="#050505"
    stroke="#ffffff"
    stroke-width="5"
    filter="url(#shadow)"
  />

  <!-- WHEEL -->

  ${slices}

  <!-- RED BORDER -->

  <circle
    cx="400"
    cy="410"
    r="300"
    fill="none"
    stroke="#ff2020"
    stroke-width="10"
    filter="url(#redGlow)"
  />

  <!-- WHITE INNER BORDER -->

  <circle
    cx="400"
    cy="410"
    r="285"
    fill="none"
    stroke="#ffffff"
    stroke-width="2"
    opacity="0.75"
  />

  <!-- CENTER -->

  <circle
    cx="400"
    cy="410"
    r="78"
    fill="#050505"
    stroke="#ff2020"
    stroke-width="10"
    filter="url(#redGlow)"
  />

  <circle
    cx="400"
    cy="410"
    r="65"
    fill="#0a0a0a"
    stroke="#ffffff"
    stroke-width="2"
  />

  <text
    x="400"
    y="405"
    text-anchor="middle"
    fill="#ffffff"
    font-size="27"
    font-family="Arial"
    font-weight="900"
    letter-spacing="2">
    NEON
  </text>

  <text
    x="400"
    y="432"
    text-anchor="middle"
    fill="#ff2020"
    font-size="13"
    font-family="Arial"
    font-weight="bold">
    BATTLE
  </text>

  <!-- POINTER -->

  <polygon
    points="400,110 378,65 422,65"
    fill="#ffffff"
    stroke="#ff2020"
    stroke-width="4"
    filter="url(#redGlow)"
  />

  <!-- CENTER DOT -->

  <circle
    cx="400"
    cy="410"
    r="9"
    fill="#ffffff"
  />

</svg>`;
}

// ========================================
// BUTTONS
// ========================================

function createButtons() {

  return new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("spin")
        .setLabel("🎡 لف العجلة")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("add")
        .setLabel("➕ إضافة عصابة")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("list")
        .setLabel("📋 العصابات")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("reset")
        .setLabel("🔄 جولة جديدة")
        .setStyle(ButtonStyle.Secondary)

    );
}

// ========================================
// START
// ========================================

async function startBot() {

  const commands = [

    new SlashCommandBuilder()
      .setName("wheel")
      .setDescription(
        "🎡 تشغيل عجلة منافسات NEON"
      )

  ].map(
    command => command.toJSON()
  );

  const rest =
    new REST({
      version: "10"
    }).setToken(
      process.env.DISCORD_TOKEN
    );

  await rest.put(

    Routes.applicationCommands(
      process.env.CLIENT_ID
    ),

    {
      body: commands
    }

  );

  await client.login(
    process.env.DISCORD_TOKEN
  );
}

// ========================================
// READY
// ========================================

client.once(
  "ready",
  () => {

    console.log(
      `🔥 NEON Wheel Online: ${client.user.tag}`
    );

  }
);

// ========================================
// INTERACTIONS
// ========================================

client.on(
  "interactionCreate",
  async interaction => {

    // ====================================
    // OWNER ONLY
    // ====================================

    if (!isOwner(interaction)) {

      if (
        interaction.isChatInputCommand() ||
        interaction.isButton() ||
        interaction.isModalSubmit()
      ) {

        await interaction.reply({

          content:
            "🔒 **هذه العجلة مخصصة لمالك السيرفر فقط.**",

          ephemeral: true

        });

      }

      return;
    }

    // ====================================
    // SLASH COMMAND
    // ====================================

    if (
      interaction.isChatInputCommand()
    ) {

      if (
        interaction.commandName ===
        "wheel"
      ) {

        const game =
          getGame(
            interaction.guildId
          );

        const svg =
          createWheelSVG(
            game.gangs
          );

        const buffer =
          Buffer.from(svg);

        const embed =
          new EmbedBuilder()

            .setTitle(
              "🎡 NEON • GANG BATTLE"
            )

            .setDescription(

              game.gangs.length >= 2

                ? "⚔️ **جاهزين للمنافسة؟**\n\nاضغط **🎡 لف العجلة** لاختيار العصابات."

                : "➕ **أضف عصابتين على الأقل للبدء.**"

            )

            .setColor(
              0xff2020
            )

            .setImage(
              "attachment://wheel.svg"
            )

            .setFooter({

              text:
                "NEON • Professional Gang Battle"

            });

        await interaction.reply({

          embeds: [
            embed
          ],

          files: [

            {
              attachment:
                buffer,

              name:
                "wheel.svg"
            }

          ],

          components: [
            createButtons()
          ]

        });

      }

      return;
    }

    // ====================================
    // BUTTON
    // ====================================

    if (
      !interaction.isButton()
    ) {
      return;
    }

    const game =
      getGame(
        interaction.guildId
      );

    // ====================================
    // ADD
    // ====================================

    if (
      interaction.customId ===
      "add"
    ) {

      const modal =
        new ModalBuilder()

          .setCustomId(
            "addGangModal"
          )

          .setTitle(
            "➕ إضافة عصابة"
          );

      const input =
        new TextInputBuilder()

          .setCustomId(
            "gangName"
          )

          .setLabel(
            "اسم العصابة"
          )

          .setPlaceholder(
            "مثال: الزرازير"
          )

          .setStyle(
            TextInputStyle.Short
          )

          .setRequired(true)

          .setMaxLength(
            30
          );

      modal.addComponents(

        new ActionRowBuilder()
          .addComponents(
            input
          )

      );

      await interaction.showModal(
        modal
      );

      return;
    }

    // ====================================
    // LIST
    // ====================================

    if (
      interaction.customId ===
      "list"
    ) {

      if (
        !game.gangs.length
      ) {

        await interaction.reply({

          content:
            "❌ لا توجد عصابات في العجلة حاليًا.",

          ephemeral: true

        });

        return;
      }

      await interaction.reply({

        content:

          "📋 **العصابات الموجودة:**\n\n" +

          game.gangs

            .map(
              (gang, index) =>
                `**${index + 1}.** ${gang}`
            )

            .join("\n"),

        ephemeral: true

      });

      return;
    }

    // ====================================
    // RESET ROUND
    // ====================================

    if (
      interaction.customId ===
      "reset"
    ) {

      // رجوع كل العصابات الأصلية
      game.gangs = [
        ...game.originalGangs
      ];

      game.firstGang = null;

      await interaction.reply({

        content:
          "🔄 **تم بدء جولة جديدة!**\n\n" +
          "♻️ تمت إعادة جميع العصابات إلى العجلة.",

        ephemeral: true

      });

      return;
    }

    // ====================================
    // SPIN
    // ====================================

    if (
      interaction.customId ===
      "spin"
    ) {

      if (
        game.gangs.length < 2
      ) {

        await interaction.reply({

          content:
            "❌ لازم يكون عندك عصابتين على الأقل.",

          ephemeral: true

        });

        return;
      }

      // اختيار عشوائي
      const randomIndex =
        Math.floor(
          Math.random() *
          game.gangs.length
        );

      const selectedGang =
        game.gangs[
          randomIndex
        ];

      // ==================================
      // REMOVE SELECTED GANG
      // ==================================

      game.gangs.splice(
        randomIndex,
        1
      );

      // ==================================
      // FIRST GANG
      // ==================================

      if (
        !game.firstGang
      ) {

        game.firstGang =
          selectedGang;

        const svg =
          createWheelSVG(

            game.gangs,

            "NEON • SECOND GANG"

          );

        const buffer =
          Buffer.from(svg);

        const embed =
          new EmbedBuilder()

            .setTitle(
              "🥇 العصابة الأولى"
            )

            .setDescription(

              `🔥 **${selectedGang}**\n\n` +

              "✅ تم اختيار العصابة الأولى.\n" +

              "🚫 تم استبعادها من السحبة الثانية.\n\n" +

              "🎡 اضغط **لف العجلة** لاختيار العصابة الثانية."

            )

            .setColor(
              0xff2020
            )

            .setImage(
              "attachment://wheel.svg"
            )

            .setFooter({

              text:
                "NEON • Gang Battle"

            });

        await interaction.update({

          embeds: [
            embed
          ],

          files: [

            {
              attachment:
                buffer,

              name:
                "wheel.svg"
            }

          ],

          components: [
            createButtons()
          ]

        });

        return;
      }

      // ==================================
      // SECOND GANG
      // ==================================

      const secondGang =
        selectedGang;

      const firstGang =
        game.firstGang;

      game.firstGang =
        null;

      const embed =
        new EmbedBuilder()

          .setTitle(
            "🔥 NEON • GANG BATTLE 🔥"
          )

          .setDescription(

            `# ${firstGang} 🆚 ${secondGang}\n\n` +

            "⚔️ **المنافسة جاهزة!**\n\n" +

            "━━━━━━━━━━━━━━━━━━━━\n" +

            "🚫 تم استبعاد العصابتين من السحب الحالية.\n" +

            "━━━━━━━━━━━━━━━━━━━━"

          )

          .setColor(
            0xff2020
          )

          .setFooter({

            text:
              "NEON • Professional Gang Battle"

          });

      await interaction.update({

        embeds: [
          embed
        ],

        components: [
          createButtons()
        ]

      });

      return;
    }

  }
);

// ========================================
// MODAL
// ========================================

client.on(
  "interactionCreate",
  async interaction => {

    if (
      !interaction.isModalSubmit()
    ) {
      return;
    }

    // OWNER ONLY
    if (
      !isOwner(interaction)
    ) {

      await interaction.reply({

        content:
          "🔒 **هذه العجلة مخصصة لمالك السيرفر فقط.**",

        ephemeral: true

      });

      return;
    }

    if (
      interaction.customId !==
      "addGangModal"
    ) {
      return;
    }

    const name =
      interaction.fields
        .getTextInputValue(
          "gangName"
        )
        .trim();

    const game =
      getGame(
        interaction.guildId
      );

    // منع التكرار
    if (
      game.originalGangs
        .includes(name)
    ) {

      await interaction.reply({

        content:
          "❌ العصابة دي موجودة بالفعل.",

        ephemeral: true

      });

      return;
    }

    // إضافة للقائمة الأصلية
    game.originalGangs.push(
      name
    );

    // إضافة للعجلة الحالية
    game.gangs.push(
      name
    );

    await interaction.reply({

      content:
        `✅ تمت إضافة **${name}** إلى عجلة NEON.`,

      ephemeral: true

    });

  }
);

// ========================================
// RUN BOT
// ========================================

startBot().catch(
  error => {

    console.error(
      "❌ NEON Wheel Error:",
      error
    );

  }
);
