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
    insertBookmark(knex, newBookmark){
        return knex
                .insert(newBookmark)
                .into('bookmarks_data')
                .returning('*')
                .then(rows => {
                    return rows[0]
                })
    },

    //delete bookmark
    deleteBookmark(knex, id){
        return knex.from('bookmarks_data').where( { id }).delete()
    }

    //update bookmark

}

module.exports = BookmarksService