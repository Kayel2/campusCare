import { doLogout, supabase } from "../main";
import * as bootstrap from "bootstrap";

const itemsImageUrl =
  "https://fprynlwueelbysitqaii.supabase.co/storage/v1/object/public/profilePicture/";
const userId = localStorage.getItem("user_id");
console.log(userId);
const postImageUrl =
  "https://fprynlwueelbysitqaii.supabase.co/storage/v1/object/public/postPicture/";
const imagePostPath = "./postPicture/";
const imageUrl = itemsImageUrl + imagePostPath;
console.log(imageUrl);
getDatas();

document.body.addEventListener("click", function (event) {
  if (event.target.id === "saveImage") {
    saveImage(event);
  } else if (event.target.id === "information_btn") {
    editProfile(event);
  } else if (event.target.id === "delete_comment") {
    deleteComment(event);
  }
});

async function getDatas(searchTerm = "") {
  let { data: user_information, error: userError } = await supabase
    .from("user_information")
    .select("*, user_program, code_name")
    .eq("id", userId);

  let { data: post, error: postError } = await supabase
    .from("post")
    .select("*,user_information(*)");

  let { data: announcements, error: announcementError } = await supabase
    .from("notice")
    .select("*");

  if (userError || postError || announcementError) {
    throw userError || postError || announcementError;
  }

  sessionStorage.setItem("user_program", user_information[0].user_program);
  sessionStorage.setItem("code_name", user_information[0].code_name);
  localStorage.setItem("posts", JSON.stringify(post));
  post.sort(() => Math.random() - 0.5);

  let container = "";

  announcements.forEach((data) => {
    document.getElementById("announcementTitle1").innerText =
      data.announcement_title;
    document.getElementById("announcementBody1").innerText = data.announcement;
    document.getElementById("profilePicture").src =
      itemsImageUrl + user_information[0].image_path;
  });

  if (searchTerm) {
    post = post.filter((p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  post.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  post.forEach((data) => {
    const imagepath = data.user_information.image_path;
    const codename = data.user_information.code_name;
    const imagepost = data.image_post;
    const postId = data.id;
    let postImage = "";
    if (imagepost) {
      postImage = `<img src="${
        postImageUrl + imagepost
      }" style="width: 400px; height: 200px"/>`;
    }
    let deleteButton = "";
    deleteButton = `<button data-id="${postId}" id="delete_btn" type="button" class="btn btn-outline-light">Delete</button>`;

    container += `
      <div class="m-3 p-3" style="border-radius: 10px; background: rgba(0, 0, 0, 0.5);" data-id="${postId}">
        <div class="card d-flex align-items-center flex-row w-100" style="border-radius: 10px; background: rgba(255, 255, 255, 0.5);">
          <img src="${
            itemsImageUrl + imagepath
          }" class="block mx-2 my-2 border border-black border-2 rounded-circle me-2" style="border-radius: 50%; width: 50px; height: 50px" alt=""/>
          <h5 class="card-title px-1">${data.title}</h5>
          <div class="row"></div>
        </div>
        <div class="card-body">
          <p class="text-light card-text d-grid mt-3">
            <cite class="text-light card-subtitle mb-2">By: ${codename}</cite>
            ${data.body}
          </p>
          <div class="row d-flex justify-content-center">
            ${postImage}
          </div>
          <div class="mt-2">
            <button type="button" class="btn btn-outline-light" data-bs-toggle="modal" data-bs-target="#comments${postId}">Comment</button>
            ${deleteButton}
            <div class="modal fade" id="comments${postId}" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="commentLabel${postId}" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h1 class="modal-title fs-5" id="commentLabel${postId}">Comments</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <div id="comments-container-${postId}"></div>
                  </div>
                  <div class="modal-footer">
                    <input type="text" id="comment-input-${postId}" class="w-100 p-3" placeholder="Write a comment..." style="height: 50px; border: 2px solid #ccc; border-radius: 10px;" />
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-outline-secondary" id="add-comment-btn-${postId}">Add Comment</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  document.getElementById("container").innerHTML = container;

  attachEventListeners();
}

document.getElementById("searchInput").addEventListener("input", function () {
  const searchTerm = this.value.trim();
  getDatas(searchTerm);
});

async function addData() {
  const formData = new FormData(form_post);
  const fileInput = document.getElementById("uploadPhotoBtn");
  const file = fileInput.files[0];
  let imagePath = "";

  if (file) {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("postPicture")
      .upload("postPicture/" + file.name, file);

    if (uploadError) {
      alert("Error uploading post picture.");
      console.error("Upload error:", uploadError.message);
      return;
    }

    imagePath = "postPicture/" + file.name;

    const { data: updateData, updateError } = await supabase
      .from("post")
      .update({ image_post: imagePath })
      .eq("id", userId);

    if (updateError) {
      alert("Error updating post with image data.");
      console.error("Update error:", updateError.message);
      return;
    }
  }

  const { data: postData, insertError } = await supabase
    .from("post")
    .insert([
      {
        title: formData.get("title"),
        body: formData.get("body"),
        image_post: imagePath,
        user_id: userId,
      },
    ])
    .select();

  if (insertError) {
    alert("Error adding post.");
    console.error("Insert error:", insertError.message);
    return;
  }

  alert("Post Successfully Added!");
  getDatas();
  window.location.reload();
}

const post_btn = document.getElementById("post_btn");
if (post_btn) {
  post_btn.onclick = () => {
    post_btn.disabled = true;
    post_btn.innerHTML = `<div class="spinner-grow spinner-grow-sm" role="status">
    <span class="visually-hidden">Loading...</span>
  </div><div class="spinner-grow spinner-grow-sm" role="status">
  <span class="visually-hidden">Loading...</span>
</div><div class="spinner-grow spinner-grow-sm" role="status">
<span class="visually-hidden">Loading...</span>
</div>`;

    addData()
      .then(() => {
        post_btn.disabled = false;
        post_btn.innerHTML = "Submit";
      })
      .catch((error) => {
        console.error("Add post failed:", error);
        post_btn.disabled = false;
        post_btn.innerHTML = "Submit";
      });
  };
}

async function deletePost(event, id) {
  const isConfirmed = window.confirm("Are you sure you want to delete Post?");

  if (!isConfirmed) {
    return;
  }

  try {
    const { error } = await supabase.from("post").delete().eq("id", id);
    if (error) {
      throw error;
    }
    alert("Post Successfully Deleted!");
    window.location.reload();
  } catch (error) {
    alert("Error Something's Wrong!");
    console.error(error);
    window.location.reload();
  }
}

document.body.addEventListener("click", function (event) {
  if (event.target.id === "delete_btn") {
    const postId = event.target.dataset.id;
    deletePost(event, postId);
  }
});

const sidebarToggle = document.querySelector("#sidebar-toggle");
sidebarToggle.addEventListener("click", function () {
  document.querySelector("#sidebar").classList.toggle("collapsed");
});

function editAnnouncement(announcementId, newTitle, newBody) {
  supabase
    .from("notice")
    .update({ announcement: newBody, announcement_title: newTitle })
    .eq("id", announcementId)
    .then((response) => {
      console.log("Announcement updated successfully:", response);
      document.getElementById("announcementTitle1").innerText = newTitle;
      document.getElementById("announcementBody1").innerText = newBody;

      const modal = document.getElementById("editAnnouncementModal");
      const modalBackdrop = document.querySelector(".modal-backdrop");
      modal.classList.remove("show");
      modalBackdrop.remove();
    })
    .catch((error) => {
      console.error("Error updating announcement:", error.message);
    });
}

document
  .querySelector(".edit-announcement")
  .addEventListener("click", function () {
    const announcementId = this.getAttribute("data-announcement-id");
    const currentTitle =
      document.getElementById("announcementTitle1").innerText;
    const currentBody = document.getElementById("announcementBody1").innerText;

    document.getElementById("newTitle").value = currentTitle;
    document.getElementById("newBody").value = currentBody;

    document
      .getElementById("saveChangesBtn")
      .addEventListener("click", function () {
        const newTitle = document.getElementById("newTitle").value;
        const newBody = document.getElementById("newBody").value;

        editAnnouncement(announcementId, newTitle, newBody);
      });
  });

const btnLogout = document.getElementById("btn_logout");
if (btnLogout) {
  btnLogout.onclick = () => {
    btnLogout.disabled = true;
    btnLogout.innerHTML = `<div class="spinner-border text-light-sm me-2" role="status" style="color: white"></div>`;

    doLogout()
      .then(() => {
        btnLogout.disabled = false;
        btnLogout.innerHTML = "Log-in";
      })
      .catch((error) => {
        console.error("Logout failed:", error);
        btnLogout.disabled = false;
        btnLogout.innerHTML = "Log-in";
      });
  };
}

async function countRows() {
  const { data, error } = await supabase
    .from("user_information")
    .select("*", { count: "exact" });
  if (error) {
    console.error("Error fetching row count:", error.message);
    return;
  }

  console.log("Data retrieved:", data);

  const userCount = data.length;
  console.log("User Count:", userCount);

  document.getElementById("user-count").innerText = userCount;
}

countRows();

async function fetchComments(post_id) {
  if (!post_id) {
    console.error("post_id is not defined");
    return;
  }

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*, user_information(*)")
    .eq("post_id", post_id);

  if (error) {
    console.error(error);
    return;
  }

  const commentsContainer = document.getElementById(
    `comments-container-${post_id}`
  );
  commentsContainer.innerHTML = "";

  comments.forEach((comment) => {
    const userImage = itemsImageUrl + comment.user_information.image_path;
    const username = comment.user_information.code_name;

    const commentCard = document.createElement("div");
    commentCard.className = "card card-body";
    commentCard.innerHTML = `
      <div class="d-flex align-items-center mb-2">
        <img src="${userImage}" alt="User Image" class="rounded-circle me-2" style="width: 30px; height: 30px;" />
        <h6 class="mb-0">${username}</h6>
      </div>
      <p>${comment.comment}</p>
    `;
    commentsContainer.appendChild(commentCard);
  });
}

async function addComment(post_id, user_id) {
  const commentInput = document.getElementById(`comment-input-${post_id}`);
  const commentText = commentInput.value;

  if (!commentText) return;

  const { error } = await supabase
    .from("comments")
    .insert([{ comment: commentText, post_id, user_id }]);

  if (error) {
    console.error(error);
    return;
  }

  commentInput.value = "";

  fetchComments(post_id, user_id);
}

function attachEventListeners() {
  document.querySelectorAll("[id^=comments]").forEach((modal) => {
    const postId = modal.id.replace("comments", "");
    modal.addEventListener("show.bs.modal", () => {
      fetchComments(postId, userId);
    });
  });

  document.querySelectorAll("[id^=add-comment-btn]").forEach((button) => {
    const postId = button.id.replace("add-comment-btn-", "");
    button.addEventListener("click", () => {
      addComment(postId, userId);
    });
  });
}
