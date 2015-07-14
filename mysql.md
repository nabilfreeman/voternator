# Random learnings
- Got reminded about LEFT JOIN
- INSERT IGNORE is really cool. It basically tries to insert into the table, and if there is already a row in there it just completes without affecting anything rather than throwing an error. Perfect for our site registration loop.

# Adding a multiple unique key to the votes table
ALTER TABLE votes ADD UNIQUE KEY (hostname,path,choice)
^^^ this means that the combination of these three columns must be unique.


>Stuff for the API:

>GET call by the API begins...

# Get all enabled choices

SELECT id
FROM choices a
WHERE a.enabled=1;

>For each enabled choice...

# Register site

INSERT IGNORE INTO `votes` (`hostname`, `path`, `choice`)
VALUES
	('localhost', '/', 1);

>Then get all scores for enabled symbols for this page.

# Get current scores for current page

SELECT hostname, path, choice, score, type, content
FROM votes a
LEFT JOIN choices b
ON a.choice=b.id
WHERE a.hostname = "localhost" AND a.path = "/" AND b.enabled = 1;

>GET call completes. Client receives list of scores for this site.

>POST call upvote

# Increment choice

UPDATE votes
SET score = score + 1
WHERE hostname = "localhost" AND path = "/" AND choice = 1;

>POST call downvote

# Decrement choice

UPDATE votes
SET score = CASE
			WHEN score = 0 THEN 0
			WHEN score > 0 THEN score - 1
			END
WHERE hostname = "localhost" AND path = "/" AND choice = 1;
