import { Prisma, PrismaClient } from "../../src";

export async function seedCourses(prisma: PrismaClient) {
  console.log("Starting courses seeding...");

  // Check if teacher exists
  const teacher = await prisma.user.findUnique({
    where: { email: "teacher@beltacourses.com" },
  });

  if (!teacher) {
    throw new Error("courses-seed should be done after users-seed");
  }

  // Course 1: Web Development Fundamentals
  const course1 = await prisma.course.create({
    data: {
      name: "Web Development Fundamentals",
      description:
        "Learn the fundamentals of web development including HTML, CSS, and JavaScript. Perfect for beginners who want to start their journey in web development.",
      price: new Prisma.Decimal("99.99"),
      status: "draft",
      teacherId: teacher.id,
    },
  });

  // Module 1 for Course 1
  const module1_1 = await prisma.module.create({
    data: {
      name: "Introduction to HTML",
      description: "Learn the basics of HTML structure and semantic elements",
      duration: "2 hours",
      order: 1,
      courseId: course1.id,
    },
  });

  await prisma.lecture.createMany({
    data: [
      {
        name: "HTML Basics",
        description: "Understanding HTML structure and basic tags",
        duration: "30 minutes",
        content:
          "# HTML Basics\n\nHTML (HyperText Markup Language) is the standard markup language for creating web pages.\n\n## Key Concepts\n\n- HTML structure\n- Common HTML tags\n- Semantic HTML\n\n## Resources\n\n- [MDN HTML Documentation](https://developer.mozilla.org/en-US/docs/Web/HTML)",
        demo: true,
        order: 1,
        moduleId: module1_1.id,
        courseId: module1_1.courseId,
      },
      {
        name: "HTML Forms",
        description: "Creating interactive forms with HTML",
        duration: "45 minutes",
        content:
          "# HTML Forms\n\nForms are essential for collecting user input.\n\n## Form Elements\n\n- Input fields\n- Text areas\n- Select dropdowns\n- Buttons\n\n## Best Practices\n\n- Proper form validation\n- Accessibility considerations",
        demo: false,
        order: 2,
        moduleId: module1_1.id,
        courseId: module1_1.courseId,
      },
      {
        name: "HTML5 Semantic Elements",
        description: "Modern HTML5 semantic elements for better structure",
        duration: "45 minutes",
        content:
          "# HTML5 Semantic Elements\n\nSemantic HTML helps create more meaningful and accessible web pages.\n\n## Semantic Tags\n\n- `<header>`\n- `<nav>`\n- `<main>`\n- `<article>`\n- `<section>`\n- `<footer>`\n\n## Benefits\n\n- Better SEO\n- Improved accessibility\n- Cleaner code structure",
        demo: false,
        order: 3,
        moduleId: module1_1.id,
        courseId: module1_1.courseId,
      },
    ],
  });

  // Module 2 for Course 1
  const module1_2 = await prisma.module.create({
    data: {
      name: "CSS Styling",
      description: "Master CSS to style your web pages beautifully",
      duration: "3 hours",
      order: 2,
      courseId: course1.id,
    },
  });

  await prisma.lecture.createMany({
    data: [
      {
        name: "CSS Fundamentals",
        description: "Introduction to CSS syntax and selectors",
        duration: "40 minutes",
        content:
          "# CSS Fundamentals\n\nCSS (Cascading Style Sheets) is used to style HTML elements.\n\n## CSS Syntax\n\n```css\nselector {\n  property: value;\n}\n```\n\n## Selectors\n\n- Element selectors\n- Class selectors\n- ID selectors\n- Attribute selectors",
        demo: true,
        order: 1,
        moduleId: module1_2.id,
        courseId: module1_2.courseId,
      },
      {
        name: "CSS Layouts",
        description: "Creating layouts with Flexbox and Grid",
        duration: "60 minutes",
        content:
          "# CSS Layouts\n\nModern CSS provides powerful layout tools.\n\n## Flexbox\n\n- Flexible container\n- Item alignment\n- Responsive design\n\n## CSS Grid\n\n- Two-dimensional layouts\n- Grid areas\n- Complex layouts",
        demo: false,
        order: 2,
        moduleId: module1_2.id,
        courseId: module1_2.courseId,
      },
      {
        name: "CSS Responsive Design",
        description: "Making your websites responsive with media queries",
        duration: "50 minutes",
        content:
          "# Responsive Design\n\nResponsive design ensures your website works on all devices.\n\n## Media Queries\n\n```css\n@media (max-width: 768px) {\n  /* Mobile styles */\n}\n```\n\n## Best Practices\n\n- Mobile-first approach\n- Flexible units (rem, em, %)\n- Breakpoint strategy",
        demo: false,
        order: 3,
        moduleId: module1_2.id,
        courseId: module1_2.courseId,
      },
    ],
  });

  // Course 2: Advanced JavaScript
  const course2 = await prisma.course.create({
    data: {
      name: "Advanced JavaScript",
      description:
        "Take your JavaScript skills to the next level with advanced concepts including async/await, closures, and modern ES6+ features.",
      price: new Prisma.Decimal("149.99"),
      status: "draft",
      teacherId: teacher.id,
    },
  });

  // Module 1 for Course 2
  const module2_1 = await prisma.module.create({
    data: {
      name: "ES6+ Features",
      description: "Modern JavaScript features and syntax",
      duration: "4 hours",
      order: 1,
      courseId: course2.id,
    },
  });

  await prisma.lecture.createMany({
    data: [
      {
        name: "Arrow Functions and Template Literals",
        description: "Modern function syntax and string interpolation",
        duration: "35 minutes",
        content:
          "# Arrow Functions and Template Literals\n\n## Arrow Functions\n\n```javascript\nconst add = (a, b) => a + b;\n```\n\nBenefits:\n- Shorter syntax\n- Lexical `this` binding\n\n## Template Literals\n\n```javascript\nconst message = `Hello, ${name}!`;\n```\n\nFeatures:\n- Multi-line strings\n- Expression interpolation",
        demo: true,
        order: 1,
        moduleId: module2_1.id,
        courseId: module2_1.courseId,
      },
      {
        name: "Destructuring and Spread Operator",
        description: "Extracting values and spreading arrays/objects",
        duration: "45 minutes",
        content:
          "# Destructuring and Spread\n\n## Array Destructuring\n\n```javascript\nconst [first, second] = array;\n```\n\n## Object Destructuring\n\n```javascript\nconst { name, age } = person;\n```\n\n## Spread Operator\n\n```javascript\nconst newArray = [...oldArray, newItem];\nconst newObject = { ...oldObject, newProp: value };\n```",
        demo: false,
        order: 2,
        moduleId: module2_1.id,
        courseId: module2_1.courseId,
      },
      {
        name: "Promises and Async/Await",
        description: "Handling asynchronous operations in modern JavaScript",
        duration: "60 minutes",
        content:
          "# Promises and Async/Await\n\n## Promises\n\n```javascript\nconst promise = new Promise((resolve, reject) => {\n  // async operation\n});\n```\n\n## Async/Await\n\n```javascript\nasync function fetchData() {\n  const data = await fetch(url);\n  return data.json();\n}\n```\n\n## Error Handling\n\n- Try/catch blocks\n- Promise rejection handling",
        demo: false,
        order: 3,
        moduleId: module2_1.id,
        courseId: module2_1.courseId,
      },
    ],
  });

  // Module 2 for Course 2
  const module2_2 = await prisma.module.create({
    data: {
      name: "Advanced Concepts",
      description: "Deep dive into closures, prototypes, and design patterns",
      duration: "5 hours",
      order: 2,
      courseId: course2.id,
    },
  });

  await prisma.lecture.createMany({
    data: [
      {
        name: "Closures and Scope",
        description: "Understanding JavaScript scope and closures",
        duration: "50 minutes",
        content:
          "# Closures and Scope\n\n## Scope\n\n- Global scope\n- Function scope\n- Block scope (let/const)\n\n## Closures\n\n```javascript\nfunction outer() {\n  const x = 10;\n  return function inner() {\n    console.log(x);\n  };\n}\n```\n\nClosures allow functions to access variables from outer scopes.",
        demo: true,
        order: 1,
        moduleId: module2_2.id,
        courseId: module2_2.courseId,
      },
      {
        name: "Prototypes and Inheritance",
        description: "JavaScript prototype-based inheritance",
        duration: "55 minutes",
        content:
          "# Prototypes and Inheritance\n\n## Prototype Chain\n\nEvery object has a prototype chain.\n\n## Constructor Functions\n\n```javascript\nfunction Person(name) {\n  this.name = name;\n}\n\nPerson.prototype.greet = function() {\n  return `Hello, ${this.name}`;\n};\n```\n\n## ES6 Classes\n\n```javascript\nclass Person {\n  constructor(name) {\n    this.name = name;\n  }\n  greet() {\n    return `Hello, ${this.name}`;\n  }\n}\n```",
        demo: false,
        order: 2,
        moduleId: module2_2.id,
        courseId: module2_2.courseId,
      },
      {
        name: "Design Patterns",
        description: "Common JavaScript design patterns",
        duration: "60 minutes",
        content:
          "# Design Patterns\n\n## Module Pattern\n\n```javascript\nconst Module = (function() {\n  const private = {};\n  return {\n    public: function() {}\n  };\n})();\n```\n\n## Observer Pattern\n\n- Event listeners\n- Pub/Sub pattern\n\n## Factory Pattern\n\n- Creating objects dynamically\n- Abstracting object creation",
        demo: false,
        order: 3,
        moduleId: module2_2.id,
        courseId: module2_2.courseId,
      },
    ],
  });

  console.log("Created courses with modules and lectures");
  console.log("Courses seeding completed successfully!");
}
