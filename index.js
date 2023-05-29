import axios from 'axios';
import { parse } from 'node-html-parser';
import RSS from 'rss';

/**
 * @returns {Promise<string>}
 */
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
          description: parse(detailPage.data).querySelector('.goods__modal__desc').textContent,
          url: 'https://bocchi.rocks/goods/',
          custom_elements: [{ image: `${baseUrl}${e.querySelector('.goods__list__thumb > span').getAttribute('style').match(/(?<=\()[^)]*/g)[0]}` }],
        };
      }),
  );

  const feed = new RSS({
    title: 'GOODS | TVアニメ「ぼっち・ざ・ろっく！」公式サイト',
    site_url: 'https://bocchi.rocks/goods/',
    description: 'GOODS | TVアニメ「ぼっち・ざ・ろっく！」公式サイト',
    language: 'ja',
  });
  goods.forEach(item => feed.item(item));
  return feed.xml();
};

export const handler = async () => ({
  statusCode: 200,
  body: await generateFeed(),
});
