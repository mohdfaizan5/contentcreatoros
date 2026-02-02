# Changelog

## February 2, 2026

### Inspirations
- Added inline editing for inspiration entries
- Click "Edit" button to edit title, notes, and "what worked" fields
- Save or cancel changes with dedicated buttons

### Sidebar Navigation
- Added "UPDATED" badges to Templates, Inspiration, Public Profile, and Lead Magnets
- Badges help users identify recently updated features

### Public Profile Updates
- Changed "Links" heading to "Public Links"
- Renamed "Branding" tab to "Edit"
- Added profile preview card showing image, name, and bio
- Replaced dark overlay with subtle edit icon on hover
- Consolidated all editing fields into single "Edit" tab
- Added username change warning when editing username
- Added logo upload feature (max 2MB, supports JPG/PNG/GIF/WebP)
- Added dynamic page metadata using display name

### Analytics
- Added "Analytics" tab to Public Profile page
- Profile view tracking when visitors view `/profile/[username]`
- Compact analytics dashboard with time range filter (Today/Week/Month/All Time)
- Simple bar chart showing views over last 14 days
- Total view count display

### Lead Magnets
- Replaced verbose analytics dashboard with compact stats cards
- Added dropdown time range filter
- Shows: Total Views, Total Leads, Conversion Rate
- Stats cards positioned below lead magnets list

### Technical
- Created database migrations for analytics tracking
- Added RLS policies for profile views, lead magnet views, and leads
- Updated server actions for analytics data fetching
