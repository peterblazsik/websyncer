# Testing Skill

Use this skill to run tests and verify the Image Converter application.

## When to Use
- After implementing a feature
- When the user types `/testing`
- When the user asks to "test what was implemented"

## Instructions

When this skill is invoked, perform the following steps:

### Step 1: Start the Flask Server
```bash
cd "/Users/peterblazsik/DevApps/WebSyncer" && python3 app.py
```
Run this in the background. The server runs on port 5001.

### Step 2: Verify Server is Running
```bash
curl -s http://localhost:5001 | head -20
```
Should return HTML content.

### Step 3: Browser Testing with Chrome Extension
Use the MCP browser tools to test the UI:

1. Get tab context:
   - Use `mcp__Claude_in_Chrome__tabs_context_mcp` with `createIfEmpty: true`
   - Create a new tab if needed with `mcp__Claude_in_Chrome__tabs_create_mcp`

2. Navigate to the app:
   - Use `mcp__Claude_in_Chrome__navigate` to go to `http://localhost:5001`

3. Test WebP Converter tab:
   - Take a screenshot to verify the UI loads correctly
   - Check that all form elements are visible (source, destination, variants)

4. Test App Store Screenshots tab:
   - Click the "App Store Screenshots" tab button
   - Take a screenshot to verify the tab switches
   - Check that all device sizes are displayed (6.9", 6.7", 6.5", 6.1", 5.5")

### Step 4: API Testing
Test the backend endpoints directly:

**Test App Store Conversion:**
```bash
# Create a test PNG
python3 -c "
from PIL import Image
img = Image.new('RGBA', (1290, 2796), color=(100, 150, 200, 255))
img.save('/tmp/test_screenshot.png')
"

# Run conversion
curl -s -X POST http://localhost:5001/start-appstore \
  -d "source=/tmp&time_filter=all&sizes=6.9&sizes=6.7&sizes=6.5"

# Wait and check results
sleep 2
ls -la /tmp/*.jpg

# Verify dimensions
python3 -c "
from PIL import Image
for size in ['6.9', '6.7', '6.5']:
    f = f'/tmp/{size}-test_screenshot.jpg'
    img = Image.open(f)
    print(f'{size}: {img.size} mode={img.mode}')
"
```

**Test WebP Conversion:**
```bash
# Create test directories
mkdir -p /tmp/webp_test_src /tmp/webp_test_dest

# Create a test PNG
python3 -c "
from PIL import Image
img = Image.new('RGB', (800, 600), color=(200, 100, 50))
img.save('/tmp/webp_test_src/test.png')
"

# Run conversion
curl -s -X POST http://localhost:5001/start \
  -d "source=/tmp/webp_test_src&dest=/tmp/webp_test_dest&variants=original"

# Check results
sleep 2
ls -la /tmp/webp_test_dest/
```

### Step 5: Clean Up Test Files
```bash
rm -f /tmp/test_screenshot.png /tmp/*.jpg
rm -rf /tmp/webp_test_src /tmp/webp_test_dest
```

### Step 6: Report Results
Summarize:
- Server started successfully: Yes/No
- UI loads correctly: Yes/No
- Tab switching works: Yes/No
- App Store conversion works: Yes/No (with correct dimensions)
- WebP conversion works: Yes/No
- Any issues found

## Expected Results

### App Store Screenshot Sizes
| Display | Expected Dimensions |
|---------|---------------------|
| 6.9"    | 1320 x 2868        |
| 6.7"    | 1290 x 2796        |
| 6.5"    | 1242 x 2688        |
| 6.1"    | 1179 x 2556        |
| 5.5"    | 1242 x 2208        |

### Output Format
- App Store: JPG files with RGB mode (no alpha)
- WebP: WebP files in organized subfolders

## Notes
- Server runs on port 5001 (not 5000, which is often used by AirPlay)
- Always clean up test files after testing
- Take screenshots of key UI states for verification
