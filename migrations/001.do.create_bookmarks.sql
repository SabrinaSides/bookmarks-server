CREATE TYPE star_rating as ENUM ('1', '2', '3', '4', '5');

CREATE TABLE bookmarks_data(
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    title text NOT NULL,
    url text NOT NULL,
    description text,
    rating star_rating NOT NULL
);