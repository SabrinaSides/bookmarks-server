const express = require('express');
const logger = require('../logger');
const { isWebUri } = require('valid-url');
const BookmarksService = require('./bookmarks-service');
const xss = require('xss');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const serialize = (bookmark) => ({
  id: bookmark.id,
  title: xss(bookmark.title), // sanitize title
  url: bookmark.url,
  description: xss(bookmark.description), // sanitize description
  rating: bookmark.rating,
});

bookmarkRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then((bookmarks) => {
        res.json(bookmarks.map(serialize));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const newBookmark = { title, url, description, rating };

    if (!title) {
      logger.error('Title is required');
      return res.status(400).send('Invalid data');
    }

    if (!url || !isWebUri(url)) {
      logger.error('URL is required');
      return res.status(400).send('Invalid data, need complete URL');
    }

    if (!rating || !Number.parseFloat(rating) || rating < 0 || rating > 5) {
      logger.error('Rating is required');
      return res.status(400).send('Invalid data');
    }

    BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
      .then((bookmark) => {
        res.status(201).location(`/bookmarks/${bookmark.id}`).json(serialize(bookmark));

        logger.info(`Bookmark with id ${bookmark.id} created`);
      })
      .catch(next);
  });

bookmarkRouter
  .route('/bookmarks/:bookmark_id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { bookmark_id } = req.params;
    BookmarksService.getById(knexInstance, bookmark_id)
      .then(bookmark => {
        if(!bookmark){
          logger.error(`Bookmark with id ${bookmark_id} not found`);
          return res.status(404).json({
            error: {message: `Bookmark doesn't exist`}
          })
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serialize(res.bookmark)) //bookmark result from .all()
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get('db');
    const { bookmark_id } = req.params;
    BookmarksService.deleteBookmark(knexInstance, bookmark_id)
      .then(() => {
        res.status(204).end()
        logger.info(`Bookmark with id ${bookmark_id} deleted`);
      })
      .catch(next)
  });

module.exports = bookmarkRouter;
