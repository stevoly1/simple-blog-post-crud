const STORAGE_KEY = "blogPosts";
const blogPosts = [];
let currentId = null;
const postForm = document.querySelector(".postForm");
const titleInp = postForm.querySelector(".title");
const authorInp = postForm.querySelector(".author");
const contentInp = postForm.querySelector(".content");
const imageInput = postForm.querySelector('#imageInput')
const submitBtn = postForm.querySelector(".submit-btn");
const postsContainer = document.querySelector("#postsContainer");



// Load posts from localStorage if available and push into blogPosts
window.addEventListener("DOMContentLoaded", ()=>{
    const savedPosts = localStorage.getItem(STORAGE_KEY);
    try {
      const parsedPosts = JSON.parse(savedPosts);
      if (Array.isArray(parsedPosts)) {
        blogPosts.push(...parsedPosts);
      }
      renderPosts();
    } catch (error) {
      console.error("Error parsing saved posts:", error);
      blogPosts = []
    }
})

postForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "publishing.."

    const file = imageInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageInBase64 = event.target.result;
            saveBlogPost(imageInBase64);
        };
        reader.readAsDataURL(file);
        reader.onerror = (error) => {
            console.error (`an error occur when loading file ${error}`)
        
          alert("cannot load files");
        };
    }else{
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
            saveToLocalStorage();
            renderPosts();
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
            saveToLocalStorage();
        }
    }
}
);


// function that save the post ,either new post or edit

function saveBlogPost (imageData){
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
        image : imageData,
        date: new Date().toLocaleString(),
      };
      blogPosts.push(newPost);
    } else {
      // update existing post
      const postIndex = blogPosts.findIndex((post) => post.id === currentId);
      if (postIndex !== -1) {
        blogPosts[postIndex].title = title;
        blogPosts[postIndex].author = author;
        blogPosts[postIndex].content = content;
        blogPosts[postIndex].image =
          imageData !== null ? imageData : blogPosts[postIndex].image;
        blogPosts[postIndex].date = new Date().toLocaleString();
      }
      // reset currentId and the button after update
      currentId = null;
      submitBtn.textContent = "Publish";
    }

    postForm.reset();
    saveToLocalStorage();
    renderPosts();
};

// function to save posts to localStorage
function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blogPosts));
  } catch (err) {
    if (err.name === "QuotaExceededError") {
      alert(
        "Cannot save post: you’ve exceeded storage quota. " +
          "Try removing some posts or upload smaller images."
      );
    } else {
      console.error("Unexpected localStorage error:", err);
    }
  }
}

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
