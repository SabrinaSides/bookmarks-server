require('dotenv').config();
const knex = require('knex');
const app = require('../src/app');
const { expect } = require('chai');
const supertest = require('supertest');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe('Bookmarks endpoints', () => {
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

      it('GET /bookmarks/:bookmark_id responds with 200 and specified bookmark', () => {
        const bookmarkID = 2;
        const expectedBookmark = testBookmarks[bookmarkID - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkID}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, expectedBookmark);
      });
    });

    context(`Given an XSS attack bookmark`, () => {
      const maliciousBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'http://www.badwebsite.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: '1'
      };

      beforeEach('insert malicious bookmark', () => {
        return db.into('bookmarks_data').insert([ maliciousBookmark ]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200)
          .expect((res) => {
            expect(res.body.title).to.eql(
              'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
            );
            expect(res.body.description).to.eql(
              `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
            );
          });
      });
    });

  });

  describe('POST /bookmarks', () => {
    afterEach('cleanup', () => db('bookmarks_data').truncate());

    it('creates a bookmark, responding with 201 and the new bookmark', () => {
      newBookmark = {
        title: 'Bookmark test',
        url: 'http://www.bookmark.com',
        description: 'A good bookmark',
        rating: '4',
      };

      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .send(newBookmark)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
        })
        .then((postRes) =>
          supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(postRes.body)
        );
    });

    context(`Given an XSS attack bookmark`, () => {
      const maliciousBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'http://www.badwebsite.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: '1'
      };

      it('removes XSS attack content', () => {
        return supertest(app)
          .post(`/bookmarks`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .send(maliciousBookmark)
          .expect(201)
          .expect((res) => {
            expect(res.body.title).to.eql(
              'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
            );
            expect(res.body.description).to.eql(
              `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
            );
          });
      });
    });
  });

  describe('DELETE /bookmarks/:bookmark_id', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks_data').insert(testBookmarks)
      })

      afterEach('clear table', () => db('bookmarks_data').truncate())

      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 1
        const expectedBookmarks = testBookmarks.filter(bookmark => idToRemove !== bookmark.id)
        return supertest(app)
          .delete(`/bookmarks/${idToRemove}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(204)
          .then(res => 
            supertest(app)
              .get('/bookmarks')
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedBookmarks)
              )
          })
    })
  })
  //last
});
