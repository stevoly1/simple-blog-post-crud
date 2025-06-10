//indexDb variables
const dbName = "blogDB";
const dbVer = 1;
const storeName = "blogPosts";
let db;  //to hold the db objects on every request
let blogPosts = [];

// open(create) indexDB request
// firstly check if the browser supports indexedDB

if (!window.indexedDB) {
    console.error("IndexedDB is not supported by this browser.");
    alert(
        "Your browser does not support IndexedDB. Please use a modern browser."
    );
}

// open the database and create an object store if it doesn't exist

const openDbReq = indexedDB.open(dbName, dbVer);

// upgrade the db and set a store and index on new open
openDbReq.onupgradeneeded = function (event){
    db = event.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: "id" });
        store.createIndex("date", "date", { unique: false });

    }
};

// on db open success it should load content from db into blogpost
openDbReq.onsuccess = function (event){
    db = event.target.result;
    loadAllFromDB();

}

openDbReq.onerror = function (event) {
    alert('an error occur while opening Db');
    console.error("IndexedDB open error:", event.target.error);
}




// const STORAGE_KEY = "blogPosts";
let currentId = null;
const postForm = document.querySelector(".postForm");
const titleInp = postForm.querySelector(".title");
const authorInp = postForm.querySelector(".author");
const contentInp = postForm.querySelector(".content");
const imageInput = postForm.querySelector('#imageInput')
const submitBtn = postForm.querySelector(".submit-btn");
const postsContainer = document.querySelector("#postsContainer");



// Load posts from localStorage if available and push into blogPosts
// window.addEventListener("DOMContentLoaded", ()=>{
//     const savedPosts = localStorage.getItem(STORAGE_KEY);
//     try {
//       const parsedPosts = JSON.parse(savedPosts);
//       if (Array.isArray(parsedPosts)) {
//         blogPosts.push(...parsedPosts);
//       }
//       renderPosts();
//     } catch (error) {
//       console.error("Error parsing saved posts:", error);
//       blogPosts = []
//     }
// })


postForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "publishing.."

    const file = imageInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const imageInBase64 = event.target.result;
            saveBlogPost(imageInBase64);
        };
        reader.readAsDataURL(file);
        reader.onerror = (error) => {
            console.error(`an error occur when loading file ${error}`)

            alert("cannot load files");
        };
    } else {
        saveBlogPost(null);
    }

});



// delete and edit click events
postsContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-btn")) {
        const postDiv = event.target.closest(".post");
        const postId = postDiv.dataset.id;
        const postIndex = blogPosts.findIndex((post) => post.id === postId);
        if (postIndex !== -1) {
            blogPosts.splice(postIndex, 1);
            renderPosts();

            // remove from DB
            const tx = db.transaction(storeName, "readwrite");
            tx.objectStore(storeName).delete(postId);
            tx.oncomplete = () => {
                renderPosts();
            }
            tx.onerror = (event) => {
              console.error("DB delete failed:", event.target.error);
            };
        }
    } else if (event.target.classList.contains("edit-btn")) {
        const postDiv = event.target.closest(".post");
        const postId = postDiv.dataset.id;
        const post = blogPosts.find((p) => p.id === postId);
        if (post) {
          titleInp.value = post.title;
          authorInp.value = post.author;
          contentInp.value = post.content;
          currentId = postId;
          submitBtn.textContent = "Update Post";

          // it will scroll to the editor and gives focus to content
          // 1) Calculate the Y offset of the form
          const rect = postForm.getBoundingClientRect();
          const formY = window.scrollY + rect.top;

          // 2) Smooth-scroll to that Y coordinate over 600ms
          smoothScrollTo(formY, 600);

          // 3) Once scrolled, focus the title (add a small timeout for safety)
          setTimeout(() => {
            contentInp.focus();
          }, 620);
        }
    }
}
);


// function to load content from db into blogPosts array
function loadAllFromDB() {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const getAll = store.getAll();
    getAll.onsuccess = (event) => {
        const dbData = event.target.result || [];
        blogPosts = [...dbData]
        // Sort descending by date (latest first)
        blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        renderPosts();
    };
    getAll.onerror = function (e) {
        console.error("Failed to load posts from DB:", e.target.error);
        alert('there was a problem while attempting to load your posts')
    };
}


// function that save the post ,either new post or edit

function saveBlogPost(imageData) {
    const title = titleInp.value.trim();
    const author = authorInp.value.trim();
    const content = contentInp.value.trim();
    if (!title || !author || !content) {
        alert("Please fill in all fields.");
        return;
    }

    if (currentId == null) {
        // when currentId is null, we are creating a new post
        const newPost = {
            id: crypto.randomUUID(),
            title: title,
            author: author,
            content: content,
            image: imageData,
            date: new Date().toLocaleString(),
        };
        blogPosts.unshift(newPost);

        // save new post t oDb
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).add(newPost);
        tx.oncomplete = () => {
          renderPosts();
          postForm.reset();
        };
        tx.onerror = (event) => {
          console.error("DB add failed:", event.target.error);
        };


    } else {
        // update existing post
        const postIndex = blogPosts.findIndex((post) => post.id === currentId);
        const oldPost = blogPosts[postIndex];
        if (postIndex === -1) {
          console.warn("Trying to update a post that isn't in blogPosts[]");
          return;
        }
       
        if (postIndex !== -1) {
            oldPost.title = title;
            oldPost.author = author;
            oldPost.content = content;
            oldPost.image =
                imageData !== null ? imageData : oldPost.image;
            oldPost.date = new Date().toLocaleString();
        }
        blogPosts.splice(postIndex, 1);
        blogPosts.unshift(oldPost);

        //   update in DB
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(oldPost);

        tx.oncomplete = () => {
            renderPosts();
            postForm.reset();

            // reset currentId and the button after update
            currentId = null;
            submitBtn.textContent = "Publish";
        };


        tx.onerror = (event) => {
            console.error("DB update failed:", event.target.error);
        };

    }



};

// Function to render posts in the postsContainer
function renderPosts() {
    postsContainer.innerHTML = "";

    // iterate through blogPost array

    blogPosts.forEach((post) => {
        const div = document.createElement("div");
        div.className = "post";
        div.dataset.id = post.id;
        // conditionally build image html if available
        let imgHTML = "";
        if (post.image) {
            imgHTML = `<img src="${post.image}" alt="Post Image" />`;
        }
        div.innerHTML = `
        ${imgHTML}
         <h2>${post.title}</h2>
          <p><em>Posted on: ${post.date}</em></p>
          <p><em>Posted by: ${post.author}</em></p>
          <p>${post.content}</p>
        <div class="controls">
        <button type="button" class="edit-btn">Edit</button>
        <button type="button" class="delete-btn">Delete</button>
        </div>
        `;
        postsContainer.appendChild(div);
        submitBtn.disabled = false;
        submitBtn.textContent = "Publish"
    });
}







// smooth scroll from the internet
function smoothScrollTo(targetY, duration = 500) {
  const startY = window.scrollY || window.pageYOffset;
  const deltaY = targetY - startY;
  const startTime = performance.now();

  // An ease-in-out cubic function (t from 0→1)
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1); // clamp 0→1
    const eased = easeInOutCubic(progress);
    window.scrollTo(0, startY + deltaY * eased);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}



// function to save posts to localStorage
// function saveToLocalStorage() {
//     try {
//         localStorage.setItem(STORAGE_KEY, JSON.stringify(blogPosts));
//     } catch (err) {
//         if (err.name === "QuotaExceededError") {
//             alert(
//                 "Cannot save post: you’ve exceeded storage quota. " +
//                 "Try removing some posts or upload smaller images."
//             );
//         } else {
//             console.error("Unexpected localStorage error:", err);
//         }
//     }
// }









// const blogPosts = [];

// document.querySelector('.post-Editor form').addEventListener('submit', (e) => {
//     e.preventDefault();

//     const title = e.target.title.value;
//     const author = e.target.author.value;
//     const content = e.target.content.value;

//     const newPost = { title, author, content };
//     blogPosts.push(newPost);

//     const postList = document.querySelector(".post-list");
//     postList.innerHTML = "";

//     blogPosts.forEach((post, index) => {
//       const postItem = document.createElement("div");
//       postItem.className = "post-item";
//       postItem.innerHTML = `
//             <h2>${post.title}</h2>
//             <p><strong>Author:</strong> ${post.author}</p>
//             <p>${post.content}</p>
//             <button class="delete-btn" data-index="${index}">Delete</button>
//         `;
//       postList.appendChild(postItem);
//     });

//     document.querySelectorAll(".delete-btn").forEach((button) => {
//       button.addEventListener("click", (e) => {
//         const index = e.target.dataset.index;
//         blogPosts.splice(index, 1);
//         e.target.parentElement.remove();
//       });
//     });

//     e.target.reset();

// });
