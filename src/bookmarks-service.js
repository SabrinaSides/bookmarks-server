const BookmarksService = {
    //put methods in our object that store our knex SQL queries

    //get all bookmarks
    getAllBookmarks(knex){
        return knex('bookmarks_data').select('*')
    },

    //get by id
    getById(knex, id){
        return knex('bookmarks_data').select('*').where('id', id).first()
    },

    //insert bookmark

    //delete bookmark

    //update bookmark

}

module.exports = BookmarksService