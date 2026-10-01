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
  TextInputStyle,
  AttachmentBuilder
} = require("discord.js");

const sharp = require("sharp");
const GIFEncoder = require("gif-encoder-2");

// ========================================
// NEON • GANG WHEEL
// ========================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// بيانات كل سيرفر
const games = new Map();

// منع تشغيل لفتين في نفس الوقت
const spinning = new Set();

// ========================================
// GAME
// ========================================

function getGame(guildId) {
  if (!games.has(guildId)) {
    games.set(guildId, {
      gangs: [],
      originalGangs: []
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
// COLORS
// ========================================

const COLORS = [
  "#080808",
  "#e50914",
  "#ffffff",
  "#151515",
  "#b00000",
  "#eeeeee"
];

// ========================================
// CREATE WHEEL SVG
// rotation = دوران العجلة بالدرجات
// ========================================

function createWheelSVG(gangs, rotation = 0) {

  const width = 700;
  const height = 700;

  const cx = 350;
  const cy = 370;
  const r = 260;

  if (!gangs.length) {
    return `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}"
     height="${height}">

  <defs>
    <radialGradient id="bg">
      <stop offset="0%" stop-color="#252525"/>
      <stop offset="60%" stop-color="#080808"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)"/>

  <circle
    cx="${cx}"
    cy="${cy}"
    r="270"
    fill="#050505"
    stroke="#ff2020"
    stroke-width="12"/>

  <text
    x="${cx}"
    y="350"
    text-anchor="middle"
    fill="#ffffff"
    font-size="38"
    font-family="Arial"
    font-weight="900">
    NEON
  </text>

  <text
    x="${cx}"
    y="390"
    text-anchor="middle"
    fill="#ff2020"
    font-size="20"
    font-family="Arial"
    font-weight="bold">
    أضف أسماء العصابات
  </text>

  <!-- POINTER -->

  <polygon
    points="350,95 330,55 370,55"
    fill="#ffffff"
    stroke="#ff2020"
    stroke-width="4"/>

</svg>`;
  }

  const angle = 360 / gangs.length;

  function polar(deg, radius) {

    const rad =
      (deg - 90) * Math.PI / 180;

    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad)
    };
  }

  let slices = "";

  gangs.forEach((gang, index) => {

    const startAngle = index * angle;
    const endAngle = startAngle + angle;

    const start = polar(startAngle, r);
    const end = polar(endAngle, r);

    const largeArc = angle > 180 ? 1 : 0;

    const color =
      COLORS[index % COLORS.length];

    const textColor =
      color === "#ffffff" ||
      color === "#eeeeee"
        ? "#000000"
        : "#ffffff";

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

    const middleAngle =
      startAngle + angle / 2;

    const textPosition =
      polar(
        middleAngle,
        r * 0.66
      );

    let fontSize = 22;

    if (gang.length > 18) {
      fontSize = 13;
    } else if (gang.length > 14) {
      fontSize = 16;
    } else if (gang.length > 10) {
      fontSize = 19;
    }

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

  return `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}"
     height="${height}">

  <defs>

    <radialGradient id="bg">
      <stop offset="0%" stop-color="#252525"/>
      <stop offset="55%" stop-color="#0b0b0b"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>

    <filter id="glow">
      <feGaussianBlur stdDeviation="6"/>
    </filter>

  </defs>

  <!-- BACKGROUND -->

  <rect
    width="100%"
    height="100%"
    fill="url(#bg)"
  />

  <!-- TITLE -->

  <text
    x="${cx}"
    y="38"
    text-anchor="middle"
    fill="#ffffff"
    font-size="25"
    font-family="Arial"
    font-weight="900"
    letter-spacing="4">
    NEON
  </text>

  <text
    x="${cx}"
    y="63"
    text-anchor="middle"
    fill="#ff2020"
    font-size="12"
    font-family="Arial"
    font-weight="bold"
    letter-spacing="2">
    GANG WHEEL
  </text>

  <!-- OUTER RED GLOW -->

  <circle
    cx="${cx}"
    cy="${cy}"
    r="275"
    fill="none"
    stroke="#ff2020"
    stroke-width="18"
    opacity="0.4"
    filter="url(#glow)"
  />

  <!-- WHEEL -->

  <g transform="rotate(${rotation} ${cx} ${cy})">

    <circle
      cx="${cx}"
      cy="${cy}"
      r="265"
      fill="#050505"
      stroke="#ffffff"
      stroke-width="5"
    />

    ${slices}

    <circle
      cx="${cx}"
      cy="${cy}"
      r="260"
      fill="none"
      stroke="#ff2020"
      stroke-width="10"
    />

    <circle
      cx="${cx}"
      cy="${cy}"
      r="75"
      fill="#050505"
      stroke="#ff2020"
      stroke-width="9"
    />

    <circle
      cx="${cx}"
      cy="${cy}"
      r="60"
      fill="#0a0a0a"
      stroke="#ffffff"
      stroke-width="2"
    />

    <text
      x="${cx}"
      y="${cy - 5}"
      text-anchor="middle"
      fill="#ffffff"
      font-size="23"
      font-family="Arial"
      font-weight="900">
      NEON
    </text>

    <text
      x="${cx}"
      y="${cy + 20}"
      text-anchor="middle"
      fill="#ff2020"
      font-size="12"
      font-family="Arial"
      font-weight="bold">
      WHEEL
    </text>

  </g>

  <!-- FIXED POINTER -->

  <polygon
    points="
      ${cx},105
      ${cx - 22},60
      ${cx + 22},60
    "
    fill="#ffffff"
    stroke="#ff2020"
    stroke-width="4"
  />

  <circle
    cx="${cx}"
    cy="${cy}"
    r="9"
    fill="#ffffff"
  />

</svg>`;
}

// ========================================
// CREATE ANIMATED GIF
// ========================================

async function createWheelGIF(
  gangs,
  selectedIndex
) {

  const width = 700;
  const height = 700;

  const encoder =
    new GIFEncoder(
      width,
      height
    );

  encoder.setDelay(80);
  encoder.setQuality(8);
  encoder.start();

  const selectedAngle =
    (selectedIndex + 0.5) *
    (360 / gangs.length);

  // نخلي القطاع المختار يوصل للسهم العلوي
  const targetRotation =
    360 - selectedAngle;

  const totalFrames = 48;

  for (
    let frame = 0;
    frame < totalFrames;
    frame++
  ) {

    const progress =
      frame / (totalFrames - 1);

    // easing
    const eased =
      1 - Math.pow(1 - progress, 3);

    const rotation =
      targetRotation * eased +
      360 * 5 * eased;

    const svg =
      createWheelSVG(
        gangs,
        rotation
      );

    const { data } =
      await sharp(
        Buffer.from(svg)
      )
        .png()
        .raw()
        .toBuffer({
          resolveWithObject: true
        });

    encoder.addFrame(data);
  }

  encoder.finish();

  return encoder.out.getData();
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
// CREATE WHEEL MESSAGE
// ========================================

async function createWheelMessage(
  interaction,
  game
) {

  const svg =
    createWheelSVG(
      game.gangs,
      0
    );

  const buffer =
    Buffer.from(svg);

  const embed =
    new EmbedBuilder()
      .setTitle(
        "🎡 NEON • GANG WHEEL"
      )
      .setDescription(
        game.gangs.length >= 2
          ? "⚔️ **جاهزين؟**\n\nاضغط **🎡 لف العجلة** لاختيار عصابة عشوائيًا."
          : "➕ **أضف عصابتين على الأقل للبدء.**"
      )
      .setColor(0xff2020)
      .setImage(
        "attachment://wheel.svg"
      )
      .setFooter({
        text:
          "NEON • Random Gang Selector"
      });

  return {
    embeds: [embed],

    files: [
      {
        attachment: buffer,
        name: "wheel.svg"
      }
    ],

    components: [
      createButtons()
    ]
  };
}

// ========================================
// START BOT
// ========================================

async function startBot() {

  const commands = [

    new SlashCommandBuilder()
      .setName("wheel")
      .setDescription(
        "🎡 تشغيل عجلة اختيار العصابات"
      )

  ].map(
    command =>
      command.toJSON()
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

    try {

      // ==================================
      // OWNER ONLY
      // ==================================

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

      // ==================================
      // SLASH COMMAND
      // ==================================

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

          const message =
            await createWheelMessage(
              interaction,
              game
            );

          await interaction.reply(
            message
          );
        }

        return;
      }

      // ==================================
      // MODAL
      // ==================================

      if (
        interaction.isModalSubmit()
      ) {

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

        if (!name) {
          await interaction.reply({
            content:
              "❌ اكتب اسم العصابة.",
            ephemeral: true
          });

          return;
        }

        const game =
          getGame(
            interaction.guildId
          );

        const exists =
          game.originalGangs.some(
            gang =>
              gang.toLowerCase() ===
              name.toLowerCase()
          );

        if (exists) {

          await interaction.reply({
            content:
              "❌ العصابة دي موجودة بالفعل.",
            ephemeral: true
          });

          return;
        }

        game.originalGangs.push(name);
        game.gangs.push(name);

        await interaction.reply({
          content:
            `✅ تمت إضافة **${name}** إلى العجلة.`,
          ephemeral: true
        });

        // تحديث رسالة العجلة نفسها
        if (
          interaction.message
        ) {

          const message =
            await createWheelMessage(
              interaction,
              game
            );

          await interaction.message.edit(
            message
          );
        }

        return;
      }

      // ==================================
      // BUTTONS
      // ==================================

      if (
        !interaction.isButton()
      ) {
        return;
      }

      const game =
        getGame(
          interaction.guildId
        );

      // ==================================
      // ADD
      // ==================================

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
            .setMaxLength(30);

        modal.addComponents(
          new ActionRowBuilder()
            .addComponents(input)
        );

        await interaction.showModal(
          modal
        );

        return;
      }

      // ==================================
      // LIST
      // ==================================

      if (
        interaction.customId ===
        "list"
      ) {

        if (!game.gangs.length) {

          await interaction.reply({
            content:
              "❌ لا توجد عصابات في العجلة حاليًا.",
            ephemeral: true
          });

          return;
        }

        await interaction.reply({

          content:
            "📋 **العصابات الموجودة حاليًا:**\n\n" +
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

      // ==================================
      // RESET
      // ==================================

      if (
        interaction.customId ===
        "reset"
      ) {

        game.gangs = [
          ...game.originalGangs
        ];

        await interaction.reply({
          content:
            "🔄 **تم بدء جولة جديدة!**\n\n♻️ رجعت جميع العصابات إلى العجلة.",
          ephemeral: true
        });

        // تحديث العجلة
        const message =
          await createWheelMessage(
            interaction,
            game
          );

        await interaction.message.edit(
          message
        );

        return;
      }

      // ==================================
      // SPIN
      // ==================================

      if (
        interaction.customId ===
        "spin"
      ) {

        if (
          spinning.has(
            interaction.guildId
          )
        ) {

          await interaction.reply({
            content:
              "⏳ العجلة بتلف بالفعل، استنى لحد ما تقف.",
            ephemeral: true
          });

          return;
        }

        if (
          game.gangs.length < 1
        ) {

          await interaction.reply({
            content:
              "❌ مفيش عصابات في العجلة.",
            ephemeral: true
          });

          return;
        }

        spinning.add(
          interaction.guildId
        );

        try {

          await interaction.deferUpdate();

          // اختيار عشوائي
          const selectedIndex =
            Math.floor(
              Math.random() *
              game.gangs.length
            );

          const selectedGang =
            game.gangs[
              selectedIndex
            ];

          // إنشاء GIF
          const gif =
            await createWheelGIF(
              game.gangs,
              selectedIndex
            );

          const attachment =
            new AttachmentBuilder(
              gif,
              {
                name:
                  "neon-wheel.gif"
              }
            );

          const spinningEmbed =
            new EmbedBuilder()
              .setTitle(
                "🎡 NEON • العجلة بتلف!"
              )
              .setDescription(
                "🔥 **استنى... العجلة بتختار!**"
              )
              .setColor(
                0xff2020
              )
              .setImage(
                "attachment://neon-wheel.gif"
              )
              .setFooter({
                text:
                  "NEON • Random Gang Selector"
              });

          await interaction.editReply({

            embeds: [
              spinningEmbed
            ],

            files: [
              attachment
            ],

            components: [
              createButtons()
            ]

          });

          // حذف العصابة المختارة
          game.gangs.splice(
            selectedIndex,
            1
          );

          // انتظار بسيط قبل إعلان النتيجة
          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                900
              )
          );

          const resultEmbed =
            new EmbedBuilder()
              .setTitle(
                "🔥 NEON • تم الاختيار!"
              )
              .setDescription(

                `# 🎯 ${selectedGang}\n\n` +

                "✅ **تم اختيار العصابة بنجاح.**\n\n" +

                `📋 المتبقي في العجلة: **${game.gangs.length}**`

              )
              .setColor(
                0xff2020
              )
              .setFooter({
                text:
                  "NEON • Random Gang Selector"
              });

          await interaction.editReply({

            embeds: [
              resultEmbed
            ],

            components: [
              createButtons()
            ]

          });

        } catch (error) {

          console.error(
            "SPIN ERROR:",
            error
          );

          await interaction.editReply({
            content:
              "❌ حصل خطأ أثناء تدوير العجلة.",
            embeds: [],
            files: [],
            components: [
              createButtons()
            ]
          });

        } finally {

          spinning.delete(
            interaction.guildId
          );

        }

        return;
      }

    } catch (error) {

      console.error(
        "INTERACTION ERROR:",
        error
      );

    }

  }
);

// ========================================
// RUN
// ========================================

startBot().catch(
  error => {

    console.error(
      "❌ NEON Wheel Error:",
      error
    );

  }
);
