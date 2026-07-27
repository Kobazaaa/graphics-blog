# Trigonometry

Trigonometry is one of the most fundamental branches of mathematics in computer science, particularly in computer mathematics and computer graphics. At its core, trigonometry studies the relationship between angles and lengths, giving us tools like sine, cosine, and tangent which will prove very useful as will be shown later on. It is what's needed to describe the relationship that involves angles, such as rotations, orientations, and anything that repeats periodically, which makes trigonometry the natural starting point before moving on to vectors and matrices.

## The core idea

At its heart, trigonometry gives you a way to convert between an angle and a ratio of lengths, and back again. Sine, cosine, and tangent take an angle and hand you a ratio, while the inverse trigonometric functions take a ratio and hand you back the angle that produced it. Everything else in this chapter (triangles, the unit circle, identities, ...) is really just different ways of putting that one core idea to work.

## Why it matters for computer graphics

Rotating an object or a camera, calculating how light falls across a surface, measuring the angle between two directions, or animating something that oscillates over time all come down to trigonometry. It's also what gives later concepts their geometric meaning, for example the dot product's connection to the angle between two vectors relies directly on the tools introduced in this chapter. Engines and math libraries handle most of the actual computation, but understanding what sine, cosine, and an angle really represent is what lets you reason about *why* a rotation behaves the way it does, or *why* a lighting calculation is coming out wrong, rather than treating it as a black box.

## Beyond computer graphics

Trigonometry is used a lot outside of computer graphics. Physics engines use it to resolve angles of collision, robotics uses it to describe the orientation of joints, and signal processing represents periodic behavior, like sound waves, directly in terms of sine and cosine. It reaches into so many fields, which is why it's important to understand it properly.

## What's in this chapter

<ChapterIndex />
