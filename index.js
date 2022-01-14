require('dotenv-flow').config();
const { WebClient } = require('@slack/web-api');
const axios = require('axios');
const dayjs = require('dayjs');
require('dayjs/locale/fr');
const timezone = require('dayjs/plugin/timezone');

const localizedFormat = require('dayjs/plugin/localizedFormat');
const worldDaysList = require('./world_days.json');
const numberTranslate = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'height', 'nine']
dayjs.locale('fr')
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.tz.setDefault(process.env.TZ);
// An access token (from your Slack app or custom integration - xoxp, xoxb)
const token = process.env.SLACK_TOKEN; // Add a bot https://my.slack.com/services/new/bot and put the token 

const web = new WebClient(token);

const sendDayMessage = (conversationId) => {
    lastSentAt = dayjs().format('HH:mm');
    let current_day = dayjs().format('YYYY-MM-DD');
    const foundDaysByDate = worldDaysList.filter((day) => day.date === current_day);

    if (foundDaysByDate.length) {
        const isManyDays = foundDaysByDate.length > 1;


        //`Aujourd'hui il y a ${foundDaysByDate.length} journée${ isManyDays ? 's' : '' } particulières${ isManyDays ? 's' : '' }`
        const blocks = [{
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": ":newspaper:  Instant culture pour égayer ta journée  :newspaper:"
            }
        }, {
            "type": "context",
            "elements": [
                {
                    "text": `*${dayjs().format('LL')}*  |  La journée mondiale`,
                    "type": "mrkdwn"
                }
            ]
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*Aujourd'hui il y a ${foundDaysByDate.length} journée${isManyDays ? 's' : ''} particulière${isManyDays ? 's' : ''}*`
            }
        }];

        let text = ' Instant culture pour égayer ta journée\n\n';
        text += `Aujourd'hui il y a ${foundDaysByDate.length} journée${isManyDays ? 's' : ''} particulière${isManyDays ? 's' : ''}\n`

        foundDaysByDate.forEach((worldDay, index) => {

            text += `----------------------------------\n`;
            blocks.push({
                "type": "divider"
            });
            blocks.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `:${numberTranslate[index + 1]}: :calendar: |   *${worldDay.title}*  | :calendar: `
                }
            });
            if (worldDay['image-src']) {
                blocks.push({
                    "type": "image",
                    "image_url": worldDay['image-src'],
                    "alt_text": worldDay.title
                })
            }

            text += `${worldDay.title}\n\n`;

            blocks.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": worldDay.description
                }
            });
            text += `${worldDay.description}\n`;
        });
        blocks.push({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Et voilà ! Passe une bonne journée !*"
            }
        });

        (async () => {
            const citation = await axios('https://kaamelott.chaudie.re/api/random')
                .then((result) => result.data.citation)
                .catch((e) => console.warn(e));
            blocks.push({
                "type": "divider"
            });
            if (citation) {
                blocks.push({
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": "Avec une petite citation ça fait pas de mal"
                        }
                    ]
                });
                blocks.push({
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": `>${citation.citation.replace(/[\(\)]/gm, '_').replace(/\'\'/gm, '"').replace(/\\n/gm, '')}`
                        }
                    ]
                });
                blocks.push({
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": `_${citation.infos.personnage} - ${citation.infos.saison} - ${citation.infos.episode}_`
                        }
                    ]
                });
            }
            web.chat.postMessage({ channel: conversationId, blocks, text }).catch((error) => console.log(error.data));
        })();
    }
}

let lastSentAt = null;
console.log("Worker starting at", dayjs().format('HH:mm'), '...');
setInterval(() => {
    if (lastSentAt !== dayjs().format('HH:mm') && (dayjs().format('HH:mm') === process.env.PUNCH_TIME || process.env.NODE_ENV === 'development')) {
        sendDayMessage(process.env.CHANNEL_ID);
    }
    console.log("Worker still running at ", dayjs().format('HH:mm'), 'waiting to punch at', process.env.PUNCH_TIME);
}, process.env.INTERVAL || 30000)