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
const GIFEncoder = require("gif-encoder");

// ========================================
// NEON • RANDOM GANG SELECTOR
// ========================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const games = new Map();
const spinning = new Set();

const WIDTH = 700;
const HEIGHT = 700;

const CX = 350;
const CY = 365;
const RADIUS = 270;

const COLORS = [
  "#080808",
  "#e50914",
  "#ffffff",
  "#171717",
  "#b00000",
  "#eeeeee",
  "#220000",
  "#101010"
];

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
// OWNER
// ========================================

function isOwner(interaction) {

  return (
    interaction.guild &&
    interaction.user.id === interaction.guild.ownerId
  );

}

// ========================================
// ESCAPE XML
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
// POLAR
// ========================================

function polar(deg, radius) {

  const rad =
    (deg - 90) *
    Math.PI /
    180;

  return {

    x:
      CX +
      radius *
      Math.cos(rad),

    y:
      CY +
      radius *
      Math.sin(rad)

  };

}

// ========================================
// SVG WHEEL
// ========================================

function createWheelSVG(
  gangs,
  rotation = 0
) {

  if (!gangs.length) {

    return `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${WIDTH}"
     height="${HEIGHT}">

<defs>

<radialGradient id="bg">

<stop offset="0%"
      stop-color="#303030"/>

<stop offset="55%"
      stop-color="#090909"/>

<stop offset="100%"
      stop-color="#000000"/>

</radialGradient>

<filter id="glow">

<feGaussianBlur
  stdDeviation="8"/>

</filter>

</defs>

<rect
  width="100%"
  height="100%"
  fill="url(#bg)"/>

<circle
  cx="${CX}"
  cy="${CY}"
  r="280"
  fill="none"
  stroke="#ff2020"
  stroke-width="20"
  opacity=".35"
  filter="url(#glow)"/>

<circle
  cx="${CX}"
  cy="${CY}"
  r="270"
  fill="#050505"
  stroke="#ffffff"
  stroke-width="5"/>

<text
  x="${CX}"
  y="340"
  text-anchor="middle"
  fill="#ffffff"
  font-family="Arial"
  font-size="42"
  font-weight="900">
NEON
</text>

<text
  x="${CX}"
  y="382"
  text-anchor="middle"
  fill="#ff2020"
  font-family="Arial"
  font-size="19"
  font-weight="bold">
RANDOM SELECTOR
</text>

</svg>`;

  }

  const angle =
    360 / gangs.length;

  let slices = "";

  gangs.forEach(
    (gang, index) => {

      const start =
        index * angle;

      const end =
        start + angle;

      const p1 =
        polar(start, RADIUS);

      const p2 =
        polar(end, RADIUS);

      const largeArc =
        angle > 180
          ? 1
          : 0;

      const color =
        COLORS[
          index %
          COLORS.length
        ];

      const textColor =
        color === "#ffffff" ||
        color === "#eeeeee"
          ? "#050505"
          : "#ffffff";

      slices += `

<path

d="
M ${CX} ${CY}
L ${p1.x} ${p1.y}
A ${RADIUS} ${RADIUS}
0 ${largeArc} 1
${p2.x} ${p2.y}
Z
"

fill="${color}"

stroke="#ffffff"
stroke-width="3"/>

`;

      const middle =
        start +
        angle / 2;

      const text =
        polar(
          middle,
          RADIUS * 0.67
        );

      let fontSize = 22;

      if (gang.length > 17)
        fontSize = 12;

      else if (gang.length > 13)
        fontSize = 15;

      else if (gang.length > 9)
        fontSize = 18;

      slices += `

<text

x="${text.x}"
y="${text.y}"

text-anchor="middle"

dominant-baseline="middle"

fill="${textColor}"

font-family="Arial"

font-size="${fontSize}"

font-weight="900"

transform="
rotate(
${middle}
${text.x}
${text.y}
)">

${escapeXML(gang)}

</text>

`;

    }
  );

  return `

<svg xmlns="http://www.w3.org/2000/svg"
     width="${WIDTH}"
     height="${HEIGHT}">

<defs>

<radialGradient id="background">

<stop offset="0%"
      stop-color="#292929"/>

<stop offset="50%"
      stop-color="#090909"/>

<stop offset="100%"
      stop-color="#000000"/>

</radialGradient>

<filter
id="redGlow"
x="-50%"
y="-50%"
width="200%"
height="200%">

<feGaussianBlur
stdDeviation="7"/>

</filter>

</defs>


<!-- BACKGROUND -->

<rect
width="100%"
height="100%"
fill="url(#background)"/>


<!-- HEADER -->

<text

x="${CX}"
y="38"

text-anchor="middle"

fill="#ffffff"

font-family="Arial"

font-size="25"

font-weight="900"

letter-spacing="4">

NEON

</text>


<text

x="${CX}"
y="61"

text-anchor="middle"

fill="#ff2020"

font-family="Arial"

font-size="12"

font-weight="bold"

letter-spacing="3">

RANDOM GANG SELECTOR

</text>


<!-- OUTER GLOW -->

<circle

cx="${CX}"
cy="${CY}"

r="282"

fill="none"

stroke="#ff2020"

stroke-width="18"

opacity=".35"

filter="url(#redGlow)"/>


<!-- ROTATING WHEEL -->

<g
transform="
rotate(
${rotation}
${CX}
${CY}
)">

<circle

cx="${CX}"
cy="${CY}"

r="274"

fill="#030303"

stroke="#ffffff"

stroke-width="5"/>


${slices}


<!-- RED INNER RING -->

<circle

cx="${CX}"
cy="${CY}"

r="265"

fill="none"

stroke="#ff2020"

stroke-width="9"/>


<!-- CENTER -->

<circle

cx="${CX}"
cy="${CY}"

r="78"

fill="#050505"

stroke="#ff2020"

stroke-width="10"/>


<circle

cx="${CX}"
cy="${CY}"

r="62"

fill="#090909"

stroke="#ffffff"

stroke-width="2"/>


<text

x="${CX}"
y="${CY - 5}"

text-anchor="middle"

fill="#ffffff"

font-family="Arial"

font-size="25"

font-weight="900">

NEON

</text>


<text

x="${CX}"
y="${CY + 20}"

text-anchor="middle"

fill="#ff2020"

font-family="Arial"

font-size="11"

font-weight="bold">

SELECT

</text>


</g>


<!-- FIXED POINTER -->

<polygon

points="
${CX},105
${CX - 24},58
${CX + 24},58
"

fill="#ffffff"

stroke="#ff2020"

stroke-width="5"/>


<circle

cx="${CX}"
cy="${CY}"

r="8"

fill="#ffffff"/>

</svg>

`;

}

// ========================================
// GIF
// ========================================

async function createWheelGIF(
  gangs,
  selectedIndex
) {

  const encoder =
    new GIFEncoder(
      WIDTH,
      HEIGHT
    );

  encoder.writeHeader();

  encoder.setRepeat(0);

  encoder.setQuality(8);

  const frames = 54;

  const sector =
    360 / gangs.length;

  const selectedCenter =
    selectedIndex * sector +
    sector / 2;

  const finalRotation =
    -selectedCenter;

  for (
    let i = 0;
    i < frames;
    i++
  ) {

    const progress =
      i /
      (frames - 1);

    /*
      البداية سريعة
      والنهاية هادئة
    */

    const ease =
      1 -
      Math.pow(
        1 - progress,
        4
      );

    const rotation =
      360 * 7 * ease +
      finalRotation * ease;

    const svg =
      createWheelSVG(
        gangs,
        rotation
      );

    const result =
      await sharp(
        Buffer.from(svg)
      )
        .ensureAlpha()
        .raw()
        .toBuffer({
          resolveWithObject: true
        });

    encoder.setDelay(
      i < 12
        ? 45
        : i < 35
          ? 65
          : 100
    );

    encoder.addFrame(
      result.data
    );

  }

  encoder.finish();

  return encoder.read();

}

// ========================================
// BUTTONS
// ========================================

function buttons() {

  return new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()

        .setCustomId(
          "spin"
        )

        .setLabel(
          "🎡 لف العجلة"
        )

        .setStyle(
          ButtonStyle.Danger
        ),

      new ButtonBuilder()

        .setCustomId(
          "add"
        )

        .setLabel(
          "➕ إضافة عصابة"
        )

        .setStyle(
          ButtonStyle.Primary
        ),

      new ButtonBuilder()

        .setCustomId(
          "list"
        )

        .setLabel(
          "📋 العصابات"
        )

        .setStyle(
          ButtonStyle.Secondary
        ),

      new ButtonBuilder()

        .setCustomId(
          "reset"
        )

        .setLabel(
          "🔄 جولة جديدة"
        )

        .setStyle(
          ButtonStyle.Secondary
        )

    );

}

// ========================================
// INITIAL MESSAGE
// ========================================

function wheelMessage(game) {

  const svg =
    createWheelSVG(
      game.gangs
    );

  const embed =
    new EmbedBuilder()

      .setTitle(
        "🎡 NEON • RANDOM GANG SELECTOR"
      )

      .setDescription(

        game.gangs.length >= 2

          ? "🔥 **العجلة جاهزة!**\n\nاضغط **🎡 لف العجلة** لاختيار اسم عشوائي."

          : "➕ **أضف عصابتين على الأقل للبدء.**"

      )

      .setColor(
        0xff2020
      )

      .setImage(
        "attachment://wheel.png"
      )

      .setFooter({

        text:
          "NEON • RANDOM SELECTOR"

      });

  return {

    embeds: [
      embed
    ],

    files: [

      {

        attachment:
          Buffer.from(svg),

        name:
          "wheel.png"

      }

    ],

    components: [
      buttons()
    ]

  };

}

// ========================================
// START
// ========================================

async function startBot() {

  const commands = [

    new SlashCommandBuilder()

      .setName(
        "wheel"
      )

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
    })

    .setToken(
      process.env.DISCORD_TOKEN
    );

  await rest.put(

    Routes.applicationCommands(
      process.env.CLIENT_ID
    ),

    {
      body:
        commands
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
      `🔥 NEON ONLINE: ${client.user.tag}`
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
      // OWNER
      // ==================================

      if (
        !isOwner(
          interaction
        )
      ) {

        if (
          interaction.isChatInputCommand() ||
          interaction.isButton() ||
          interaction.isModalSubmit()
        ) {

          await interaction.reply({

            content:
              "🔒 **العجلة مخصصة لمالك السيرفر فقط.**",

            ephemeral:
              true

          });

        }

        return;

      }

      // ==================================
      // /wheel
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

          await interaction.reply(
            wheelMessage(
              game
            )
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

            ephemeral:
              true

          });

          return;

        }

        const game =
          getGame(
            interaction.guildId
          );

        const duplicate =
          game.originalGangs
            .some(
              gang =>
                gang.toLowerCase() ===
                name.toLowerCase()
            );

        if (duplicate) {

          await interaction.reply({

            content:
              "❌ الاسم موجود بالفعل.",

            ephemeral:
              true

          });

          return;

        }

        game.originalGangs.push(
          name
        );

        game.gangs.push(
          name
        );

        await interaction.reply({

          content:
            `✅ تمت إضافة **${name}** إلى العجلة.`,

          ephemeral:
            true

        });

        return;

      }

      // ==================================
      // BUTTON
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

            .setRequired(
              true
            )

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

      // ==================================
      // LIST
      // ==================================

      if (
        interaction.customId ===
        "list"
      ) {

        if (
          !game.gangs.length
        ) {

          await interaction.reply({

            content:
              "❌ لا توجد أسماء متبقية.",

            ephemeral:
              true

          });

          return;

        }

        await interaction.reply({

          content:

            "📋 **الأسماء الموجودة:**\n\n" +

            game.gangs
              .map(
                (gang, index) =>
                  `**${index + 1}.** ${gang}`
              )
              .join("\n"),

          ephemeral:
            true

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

        game.gangs =
          [
            ...game.originalGangs
          ];

        await interaction.reply({

          content:
            "🔄 **تمت إعادة الجولة.**\n\n♻️ رجعت جميع الأسماء إلى العجلة.",

          ephemeral:
            true

        });

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
              "⏳ **العجلة بتلف بالفعل!**",

            ephemeral:
              true

          });

          return;

        }

        if (
          game.gangs.length < 1
        ) {

          await interaction.reply({

            content:
              "❌ لا توجد أسماء في العجلة.",

            ephemeral:
              true

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

          // إنشاء الدوران
          const gif =
            await createWheelGIF(

              game.gangs,

              selectedIndex

            );

          const file =
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
                "🎡 NEON • العجلة تدور"
              )

              .setDescription(
                "⚡ **جاري الاختيار...**"
              )

              .setColor(
                0xff2020
              )

              .setImage(
                "attachment://neon-wheel.gif"
              )

              .setFooter({

                text:
                  "NEON • RANDOM SELECTOR"

              });

          await interaction.editReply({

            embeds: [
              spinningEmbed
            ],

            files: [
              file
            ],

            components: [
              buttons()
            ]

          });

          // حذف الاسم بعد الاختيار
          game.gangs.splice(
            selectedIndex,
            1
          );

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                700
              )
          );

          const result =
            new EmbedBuilder()

              .setTitle(
                "🎯 NEON • تم الاختيار"
              )

              .setDescription(

                `# 🔥 ${selectedGang}\n\n` +

                "✅ **تم اختيار الاسم بنجاح.**\n\n" +

                `📋 الأسماء المتبقية: **${game.gangs.length}**`

              )

              .setColor(
                0xff2020
              )

              .setFooter({

                text:
                  "NEON • RANDOM SELECTOR"

              });

          await interaction.editReply({

            embeds: [
              result
            ],

            files: [],

            components: [
              buttons()
            ]

          });

        } catch (error) {

          console.error(
            "SPIN ERROR:",
            error
          );

          await interaction.editReply({

            content:
              "❌ حصل خطأ أثناء تشغيل العجلة.",

            embeds: [],

            files: [],

            components: [
              buttons()
            ]

          });

        } finally {

          spinning.delete(
            interaction.guildId
          );

        }

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

startBot()
  .catch(
    error => {

      console.error(
        "❌ START ERROR:",
        error
      );

    }
  );
