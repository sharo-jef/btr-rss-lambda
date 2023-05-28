import axios from 'axios';
import { parse } from 'node-html-parser';
import { json2xml } from 'xml-js';

const generateFeed = async () => {
  const baseUrl = 'https://bocchi.rocks/';
  const indexPage = await axios.get(`${baseUrl}/goods/`);
  const goods = await Promise.all(
    parse(indexPage.data)
      .querySelectorAll('.goods__list__item')
      .map(async e => {
        const itemId = e.getAttribute('data-itemid');
        const detailPage = await axios.get(`${baseUrl}/goods/?item_id=${itemId}`);
        return {
          guid: `${itemId}`,
          title: e.querySelector('.goods__list__title').textContent,
          image: `${baseUrl}${e.querySelector('.goods__list__thumb > span').getAttribute('style').match(/(?<=\()[^)]*/g)[0]}`,
          description: parse(detailPage.data).querySelector('.goods__modal__desc').textContent,
          link: 'https://bocchi.rocks/goods/',
        };
      }),
  );
  const feedObject = {
    declaration: {
      attributes: {
        version: '1.0',
        encoding: 'utf-8',
      },
    },
    elements: [{
      type: 'element',
      name: 'rss',
      attributes: {
        version: '2.0',
      },
      elements: [
        {
          type: 'element',
          name: 'channel',
          elements: [
            {
              type: 'element',
              name: 'title',
              elements: [
                {
                  type: 'text',
                  text: 'GOODS | TVアニメ「ぼっち・ざ・ろっく！」公式サイト',
                },
              ],
            },
            {
              type: 'element',
              name: 'link',
              elements: [
                {
                  type: 'text',
                  text: 'https://bocchi.rocks/goods/',
                },
              ],
            },
            {
              type: 'element',
              name: 'description',
              elements: [
                {
                  type: 'text',
                  text: 'GOODS | TVアニメ「ぼっち・ざ・ろっく！」公式サイト',
                },
              ],
            },
            {
              type: 'element',
              name: 'language',
              elements: [
                {
                  type: 'text',
                  text: 'ja',
                },
              ],
            },
          ],
        },
      ],
    }],
  };
  feedObject.elements[0].elements[0].elements = goods
    .map(item => ({
      type: 'element',
      name: 'item',
      elements: [
        {
          type: 'element',
          name: 'guid',
          attributes: {
            isPermaLink: false,
          },
          elements: [
            {
              type: 'text',
              text: item.guid,
            },
          ],
        },
        {
          type: 'element',
          name: 'title',
          elements: [
            {
              type: 'text',
              text: item.title,
            },
          ],
        },
        {
          type: 'element',
          name: 'description',
          elements: [
            {
              type: 'text',
              text: item.description,
            },
          ],
        },
        {
          type: 'element',
          name: 'link',
          elements: [
            {
              type: 'text',
              text: item.link,
            },
          ],
        },
        {
          type: 'element',
          name: 'image',
          elements: [
            {
              type: 'text',
              text: item.image,
            },
          ],
        },
      ],
    }));
  return json2xml(feedObject);
};

export const handler = async () => ({
  statusCode: 200,
  body: await generateFeed(),
});
