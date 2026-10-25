Users and staff upload images and documents, and the system keeps a record of each one.

### Delete

Deleting a file is instant: the file just stops being available. The actual removal happens later in
the background, so a request never waits on it. A deleted file can't be recovered after the next
weekly clean-up.

### Several files at once

Courses and lectures can have many images, so uploading or deleting several files is a single request.
