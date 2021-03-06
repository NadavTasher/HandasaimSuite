/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/ScheduleSuite/
 **/

const MOBILE_GRADE_COOKIE = "grade";

function mobile_load(schedule) {
    mobile_names_load(schedule);
    if (SCHEDULE_MESSAGES in schedule) {
        mobile_messages_load(schedule[SCHEDULE_MESSAGES], mobile_get("message"));
    } else {
        hide(mobile_get("message"));
    }
    if (SCHEDULE_GRADES in schedule) {
        if (global_has_cookie(MOBILE_GRADE_COOKIE)) {
            mobile_grade_load(schedule, global_pull_cookie(MOBILE_GRADE_COOKIE));
        } else {
            mobile_grade_load(schedule, schedule[SCHEDULE_GRADES][0][SCHEDULE_NAME]);
        }
    }
    // Nudge iOS users to install the app
    instruct();
}

function mobile_messages_load(messages) {
    // Check for messages in schedule
    if (messages.length > 0) {
        // Sets an interval to switch messages every X(MessageRefreshInterval) seconds
        let next = () => {
            let message = messages.shift();
            view.innerText = message;
            messages.push(message);
        };
        next();
        setInterval(next, GLOBAL_MESSAGE_INTERVAL);
        show(mobile_get("right"));
    } else {
        hide(mobile_get("right"));
    }
}

function mobile_names_load(schedule) {
    let listStudents = mobile_get("students");
    let listTeachers = mobile_get("teachers");
    if (SCHEDULE_GRADES in schedule &&
        SCHEDULE_TEACHERS in schedule) {
        global_enabled_students((result) => {
            if (result) {
                clear(listStudents);
                for (let gradeIndex = 0; gradeIndex < schedule[SCHEDULE_GRADES].length; gradeIndex++) {
                    let grade = make("button", schedule[SCHEDULE_GRADES][gradeIndex][SCHEDULE_NAME]);
                    grade.style.padding = "2vh";
                    grade.addEventListener("click", function () {
                        mobile_grade_load(schedule, grade.innerText);
                    });
                    listStudents.appendChild(grade);
                }
            }
        });
        global_enabled_teachers((result, prefix) => {
            if (result) {
                clear(listTeachers);
                for (let teacherIndex = 0; teacherIndex < schedule[SCHEDULE_TEACHERS].length; teacherIndex++) {
                    const name = schedule[SCHEDULE_TEACHERS][teacherIndex][SCHEDULE_NAME];
                    if (prefix === null || name.startsWith(prefix)) {
                        let teacher = make("button", name);
                        teacher.style.padding = "2vh";
                        teacher.addEventListener("click", function () {
                            mobile_teacher_load(schedule, name);
                        });
                        listTeachers.appendChild(teacher);
                    }
                }
            }
        });
    }
}

function mobile_grade_load(schedule, name) {
    view(mobile_get("subjects"));
    let grade = null;
    if (SCHEDULE_GRADES in schedule) {
        for (let g = 0; g < schedule[SCHEDULE_GRADES].length; g++) {
            if (SCHEDULE_NAME in schedule[SCHEDULE_GRADES][g] && SCHEDULE_SUBJECTS in schedule[SCHEDULE_GRADES][g]) {
                if (schedule[SCHEDULE_GRADES][g][SCHEDULE_NAME] === name) grade = schedule[SCHEDULE_GRADES][g];
            }
        }
    }
    if (grade !== null) {
        if (SCHEDULE_DAY in schedule &&
            SCHEDULE_SUBJECTS in grade) {
            mobile_glance(grade[SCHEDULE_NAME], global_day_to_text(schedule[SCHEDULE_DAY]));
            mobile_buttons_load(schedule, grade);
            mobile_subjects_load(schedule[SCHEDULE_TIMES], grade[SCHEDULE_SUBJECTS]);
            global_push_cookie(MOBILE_GRADE_COOKIE, grade[SCHEDULE_NAME]);
        }
    }
}

function mobile_teacher_load(schedule, name) {
    view(mobile_get("subjects"));
    let teacher = null;
    if (SCHEDULE_TEACHERS in schedule) {
        for (let g = 0; g < schedule[SCHEDULE_TEACHERS].length; g++) {
            if (SCHEDULE_NAME in schedule[SCHEDULE_TEACHERS][g] && SCHEDULE_SUBJECTS in schedule[SCHEDULE_TEACHERS][g]) {
                if (schedule[SCHEDULE_TEACHERS][g][SCHEDULE_NAME] === name) teacher = schedule[SCHEDULE_TEACHERS][g];
            }
        }
    }
    if (teacher !== null) {
        if (SCHEDULE_DAY in schedule &&
            SCHEDULE_SUBJECTS in teacher) {
            mobile_glance(teacher[SCHEDULE_NAME].split(" ")[0], global_day_to_text(schedule[SCHEDULE_DAY]));
            mobile_subjects_load(schedule[SCHEDULE_TIMES], teacher[SCHEDULE_SUBJECTS]);
        }
    }
}

function mobile_buttons_load(schedule, grade, separator = "\n") {

    function mobile_export_grade(grade, separator = "\n") {
        // Make sure grade has both name and subjects grade
        if (SCHEDULE_NAME in grade &&
            SCHEDULE_SUBJECTS in grade) {
            // Initialize text with grade name and linebreak
            let text = grade[SCHEDULE_NAME] + separator;
            // Loop through hours
            for (let h = 0; h <= SCHEDULE_LONGEST_DAY; h++) {
                // Make sure subjects array has the current hour
                if (h.toString() in grade[SCHEDULE_SUBJECTS]) {
                    // Make sure subject has a name
                    if (SCHEDULE_NAME in grade[SCHEDULE_SUBJECTS][h]) {
                        // Add subject to text
                        text += "\u200F" + h.toString() + ". " + grade[SCHEDULE_SUBJECTS][h][SCHEDULE_NAME] + separator;
                    }
                }
            }
            return text;
        }
        return "";
    }

    let grades = "";
    // Make sure schedule has grades
    if (SCHEDULE_GRADES in schedule) {
        // Loop through grades
        for (let g = 0; g < schedule[SCHEDULE_GRADES].length; g++) {
            // Make sure grades have a grade property
            if (SCHEDULE_GRADE in schedule[SCHEDULE_GRADES][g] && SCHEDULE_GRADE in grade) {
                // Make sure the grades properties are equal
                if (schedule[SCHEDULE_GRADES][g][SCHEDULE_GRADE] === grade[SCHEDULE_GRADE]) {
                    // Add grade to text
                    grades += mobile_export_grade(schedule[SCHEDULE_GRADES][g], separator) + separator + separator;
                }
            }
        }
    }
    mobile_get("external-share-grade").addEventListener("click", global_share_callback(mobile_export_grade(grade, separator)));
    mobile_get("external-share-grades").addEventListener("click", global_share_callback(grades));
}

function mobile_subjects_load(schedule, subjects) {
    // Clear subjects list
    clear(mobile_get("subjects"));
    // Loop through hours
    for (let h = 0; h <= SCHEDULE_LONGEST_DAY; h++) {
        // Check if hour exists in subjects
        if (h.toString() in subjects) {
            // Create the subject view
            let subject = make("div");
            // Make the subject an input
            input(subject);
            // Set minimal height
            subject.style.minHeight = "fit-content";
            // Create the bottom view
            let bottom = make("div");
            // Make the bottom view a row
            row(bottom);
            // Set alignments
            bottom.style.justifyContent = "space-evenly";
            // Add teacher names to the bottom view
            if (SCHEDULE_TEACHERS in subjects[h])
                bottom.appendChild(make("p", global_teachers_to_text(subjects[h][SCHEDULE_TEACHERS])));
            // Add beginning and ending times to bottom view
            bottom.appendChild(make("p", global_times_to_text(schedule, h)));
            // Add subject name and hour to the subject view
            let top = make("p", "\u200F" + h.toString() + ". " + subjects[h][SCHEDULE_NAME]);
            top.style.justifyContent = "start";
            subject.appendChild(top);
            // Add bottom view to subject view
            subject.appendChild(bottom);
            // Hide bottom view
            hide(bottom);
            // Set onclick listener of subject
            subject.addEventListener("click", () => {
                // Check visibility of bottom
                if (!visible(bottom)) {
                    // If not visible, show it
                    show(bottom);
                } else {
                    // If visible, hide it
                    hide(bottom);
                }
            });
            // Add subject to subjects list
            mobile_get("subjects").appendChild(subject);
        }
    }
}

function mobile_glance(name, day) {
    mobile_get("name").innerText = name;
    mobile_get("day").innerText = day;
}

function mobile_get(v) {
    return get("mobile-" + v);
}
