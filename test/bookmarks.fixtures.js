function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'Yahoo',
            url: 'http://www.yahoo.com',
            description: 'A website',
            rating: '1'
        },
        {
            id: 2,
            title: 'Google',
            url: 'http://www.google.com',
            description: 'A better website',
            rating: '5'
        }
    ]
}

module.exports = {
    makeBookmarksArray
}