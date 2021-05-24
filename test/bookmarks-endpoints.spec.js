require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
const { expect } = require('chai');
const supertest = require('supertest');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe.only('Bookmarks endpoints', () => {
  //create database variable
  let db;

  //create knex instance to connect to test database
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
    //skipping over server.js when running tests
    //so need to return knex instance to app in test env
  });

  //clear data so we have a clean test table
  before('clean the table', () => db('bookmarks_data').truncate());

  //disconnect from db after all tests have run so tests don't "hang"
  after('disconnect from db', () => db.destroy());

  describe('GET /bookmarks', () => {
    context('Given there are no bookmarks', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, []);
      });
    });
    context('Given there are bookmarks in the db', () => {
      //pull in test data
      const testBookmarks = makeBookmarksArray();

      //fills test table with out test data
      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks_data').insert(testBookmarks);
      });

      //clear data after each test to prevent "test leak"
      afterEach('cleanup', () => db('bookmarks_data').truncate());

      //use supertest to make requests to our express instance's GET handler
      it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, testBookmarks);
      });
    });
  });

  describe('GET /bookmarks/:bookmark_id', () => {
    context('Given there are no bookmarks', () => {
      it('Responds with 404', () => {
        const bookmarkId = 1234;
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context('Given there are bookmarks in the db', () => {
      const testBookmarks = makeBookmarksArray();

      //fills test table with out test data
      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks_data').insert(testBookmarks);
      });

      //clear data after each test to prevent "test leak"
      afterEach('cleanup', () => db('bookmarks_data').truncate());

      it('GET /bookmarks/:bookmark_id responds with 200 and specified bookmark', () =>{
          const bookmarkID = 2;
          const expectedBookmark = testBookmarks[bookmarkID - 1]
          return supertest(app)
          .get(`/bookmarks/${bookmarkID}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, expectedBookmark)
      });
    });
  });

  //last
});
