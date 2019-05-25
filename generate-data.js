const casual = require('casual');
const fs = require('fs');

// Random 50 posts data
const posts = [];
Array.from(new Array(50).keys()).map(() => {
  const post = {
    id: casual.uuid,
    title: casual.title,
    author: casual.full_name,
    description: casual.words(50),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    imageUrl: `https://picsum.photos/id/${casual.integer(1, 1000)}/1368/400`,
  };

  posts.push(post);
});

// Setup db object
const db = {
  posts,
};

// Save posts array to db.json file
fs.writeFile('db.json', JSON.stringify(db), () => {
  console.log(`Generate ${posts.length} sample post records and saved in db.json!!! =))`);
});
