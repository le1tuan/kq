const express = require('express');
const Crawler = require('crawler');
const fs = require('fs');
const Parser = require('rss-parser');

const router = express.Router();


const c = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback(error, res, done) {
    if (error) {
      console.log(error);
    } else {
      const $ = res.$;
      // $ is Cheerio by default
      // a lean implementation of core jQuery designed specifically for the server
      console.log($('title').text());
    }
    done();
  },
});


/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));
// router.get('/a', (req, res) => {
//   const parser = new Parser();
//   (async () => {
//     const feed = await parser.parseURL('http://kqxs.info/rss-feed/mien-nam-xsmn.rss');
//     console.log(feed.items);

//     // feed.items.forEach((item) => {
//     //   console.log(`${item.title}:${item.link}`);
//     // });
//   })();
// });

router.get('/:params?', (req, ress) => {
  console.log('------');
  const a = ['mien-bac', 'mien-nam', 'mien-trung'];
  let q = '';
  if (req.params.params && a.indexOf(req.params.params) !== -1) {
    q = req.params.params;
  }
  c.queue([{
    uri: `http://www.kqxs.vn/${q || ''}`,
    jQuery: true,

    // The global callback won't be called
    callback(error, res, done) {
      if (error) {
        console.log(error);
      } else {
        const $ = res.$;

        const content = [];
        const title = [];
        let index = 0;
        let a = $('.kq table');
        a = a.text().split('\n').map(item => item.trim()).filter(item => !!item);
        a = a
          .map((item, index1) => {
            if (item !== 'Giải') {
              if (item.indexOf('Xổ số') !== -1) {
                content[index] = {
                  label: item,
                  data: [],
                };
                title.push(item);
                index += 1;
              }
              if (item === 'Đặc biệt' || (item.indexOf('Giải') !== -1 && item.length > 4)) {
                content[index - 1] = {
                  ...content[index - 1],
                  data: [
                    ...content[index - 1].data,
                    { value: a[index1 + 1].match(/\d+/) ? a[index1 + 1] : '', label: item },
                  ],

                };
              }
            }
          });
        console.log(content);
        ress.render('index.ejs', {
          kq: content,
        });
      }
      done();
    },
  }]);
});

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

module.exports = router;
