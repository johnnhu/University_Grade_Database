Please edit this template and commit to the master branch for your user stories submission.   
Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for the Definitions of Done! You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-21w2-intro-to-se/project/checkpoint-3).

## User Story 1
As a Vancouver Education Board systems administrator, I want to remove specific university data so that I can update the database with universities that are no longer offering courses.


#### Definitions of Done(s)
Scenario: The user successfully removes a dataset from the database.\
Given: The user is on the home-page with predetermined information on which university dataset to remove from the database.\
When: The user enters a valid courses dataset name that does exist.\
Then: The application removes the courses dataset from the database and returns the id (string) of the dataset that was removed and displays it via an alert. 

Scenario 2: The user fails to remove a dataset from the database. \
Given: The user is on the home-page with predetermined information on which university dataset to remove from the database. \
When: The user enters a dataset id for a dataset (university) that does not exist. \
Then: The application displays an error on the webpage via an alert with the message, "Error 404: Dataset you are trying to remove does not exist! Please check for typos :)" 


## User Story 2
As a Vancouver Education Board systems administrator, I want to look at a list of all universities in the database  so that I can know how many courses they offer.

#### Definitions of Done(s)
Scenario 1: The user is on the home-page. \
Given: The user is on the home-page. \
When: The user clicks on the ‘List Universities’ button. \
Then: The application displays a list of all universities available in the database with each university’s name (dataset id) and number of courses offered (dataset numRows)

Scenario 2: The list of datasets is empty \
Given: The user is on the home-page.\
When: The user clicks on the ‘List Universities’ button.\
Then: The application displays an alert stating, “List is empty!”

## Others
You may provide any additional user stories + DoDs in this section for general TA feedback.  
Note: These will not be graded.

## User Story 3
As a Vancouver Education Board systems administrator, I want to add a university dataset to the database so that I can update the database.

## Definitions of Done(s)
Scenario 1: User uploads and adds a valid courses dataset named "validCoursesDataset" \
Given: The user is on the home-page \
When: The user uploads a valid zip file, enters the dataset name and kind and clicks on "Add a dataset" \
Then: The application adds a courses dataset to the dataset and displays an alert, "Database now contains validCoursesDataset" and displays the updated list of datasets on the screen. 

Scenario 2: User uploads and adds an invalid courses dataset named "courses_dataset" \
Given: The user is on the home-page \
When: The user uploads a valid zip file, enters the invalid dataset name and kind and clicks on "Add a dataset" \
Then: The application DOES NOT add the dataset and instead displays an alert, "Dataset ID that you entered is not valid!. Please remove any whitespaces or underscores :)" 

Scenario 3: User uploads and a valid courses dataset named "courses_dataset" but invalid kind of "invalid" \
Given: The user is on the home-page \
When: The user uploads a valid zip file, enters the dataset name and invalid kind and clicks on "Add a dataset" \
Then: The application DOES NOT add the dataset and instead displays an alert, "Dataset ID that you entered is not valid!. Please remove any whitespaces or underscores :)" 

