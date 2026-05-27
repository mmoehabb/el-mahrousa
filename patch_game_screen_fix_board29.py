import re

with open("src/index.css", "r") as f:
    content = f.read()

# remove empty media query
content = content.replace("""
@media (max-width: 1023px) {
}""", "")

with open("src/index.css", "w") as f:
    f.write(content)
