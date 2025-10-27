# cPanel Installation Guide

This guide will walk you through deploying the XR Memory Assistant application on your cPanel hosting server.

## Prerequisites

Before you begin, ensure you have:
- ✅ Active cPanel hosting account
- ✅ Access to cPanel File Manager
- ✅ Domain name or subdomain configured
- ✅ SSL certificate installed (HTTPS required for WebXR)

## Step-by-Step Installation

### Step 1: Access cPanel

1. Log into your cPanel account
   - URL typically: `https://yourdomain.com:2083`
   - Or use your hosting provider's cPanel login page
2. Enter your cPanel username and password
3. You should see the cPanel dashboard

### Step 2: Prepare the Installation Directory

1. **Navigate to File Manager**
   - Look for "File Manager" icon in the "Files" section
   - Click to open

2. **Choose installation location**:

   **Option A: Main domain (https://yourdomain.com/)**
   - Navigate to `public_html` folder
   - Upload files directly here

   **Option B: Subdirectory (https://yourdomain.com/xr-memory/)**
   - Navigate to `public_html` folder
   - Click "New Folder" button
   - Create folder named `xr-memory` (or your preferred name)
   - Enter the new folder

   **Option C: Subdomain (https://xr.yourdomain.com/)**
   - First, create subdomain in cPanel:
     - Go to "Domains" → "Subdomains"
     - Enter subdomain name (e.g., `xr`)
     - Click "Create"
   - Navigate to the subdomain's folder (usually `public_html/xr`)

### Step 3: Upload Application Files

1. **Prepare files for upload**
   - Download or copy all files from the `tryagain` folder
   - Create a ZIP file containing all contents:
     ```
     tryagain.zip containing:
     ├── index.html
     ├── css/
     ├── js/
     ├── assets/
     ├── README.md
     └── other files...
     ```

2. **Upload via cPanel**

   **Method A: ZIP Upload (Recommended)**
   - In File Manager, click "Upload" button
   - Select your `tryagain.zip` file
   - Wait for upload to complete
   - Right-click the ZIP file
   - Select "Extract"
   - Choose extract location
   - Delete the ZIP file after extraction

   **Method B: Individual File Upload**
   - In File Manager, click "Upload"
   - Select all files and folders
   - Wait for upload to complete
   - Verify folder structure is maintained

   **Method C: FTP Upload**
   - Use FTP client (FileZilla, etc.)
   - Connect using FTP credentials from cPanel
   - Upload entire `tryagain` folder
   - Verify all files transferred

### Step 4: Verify File Structure

After upload, your directory should look like:

```
public_html/xr-memory/  (or your chosen directory)
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── database.js
│   ├── xr-manager.js
│   ├── person-tracker.js
│   └── ui-manager.js
├── assets/
├── README.md
├── CPANEL_SETUP.md
└── DEVELOPMENT.md
```

### Step 5: Set Correct Permissions

1. **Check file permissions**:
   - Select all files
   - Click "Permissions" or "Change Permissions"
   - Set to **644** for files (rw-r--r--)
   - Set to **755** for folders (rwxr-xr-x)

2. **Apply recursively**:
   - Check "Recurse into subdirectories"
   - Click "Change Permissions"

### Step 6: Configure SSL/HTTPS

**WebXR requires HTTPS!** This is mandatory.

1. **Install SSL Certificate**:
   - In cPanel, go to "Security" → "SSL/TLS Status"
   - Find your domain
   - Click "Run AutoSSL" (for free Let's Encrypt certificate)
   - Wait for installation to complete

2. **Force HTTPS** (Optional but recommended):
   - Create/edit `.htaccess` file in installation directory
   - Add these lines:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

3. **Verify HTTPS**:
   - Visit your site using `https://`
   - Check for padlock icon in browser
   - WebXR will not work without valid SSL

### Step 7: Configure .htaccess (Optional)

Create or edit `.htaccess` in your installation directory:

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Enable CORS for WebXR resources
Header set Access-Control-Allow-Origin "*"

# Set proper MIME types
AddType application/javascript .js
AddType text/css .css
AddType application/json .json

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType image/png "access plus 1 year"
</IfModule>

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"

# Disable directory browsing
Options -Indexes

# Custom error pages (optional)
ErrorDocument 404 /404.html
</Ifaccess>
```

### Step 8: Test the Installation

1. **Access the application**:
   - Open Meta Quest browser
   - Navigate to your URL:
     - `https://yourdomain.com/` (if installed in root)
     - `https://yourdomain.com/xr-memory/` (if in subdirectory)
     - `https://xr.yourdomain.com/` (if subdomain)

2. **Check for errors**:
   - Application should load
   - "Enter VR Mode" button should appear
   - Check browser console for any errors (if accessible)

3. **Test VR mode**:
   - Click "Enter VR Mode"
   - Grant permissions if requested
   - Verify headset tracking works

### Step 9: Optimize Performance (Optional)

1. **Enable PHP OPcache** (if applicable):
   - Go to "Software" → "Select PHP Version"
   - Enable OPcache extension

2. **Configure CloudFlare** (if using):
   - Set SSL to "Full (strict)"
   - Enable "Always Use HTTPS"
   - Enable Auto Minify for JS/CSS

3. **Set up caching**:
   - The `.htaccess` rules above enable browser caching
   - Consider using cPanel's "Optimize Website" feature

## Troubleshooting

### Issue: "WebXR not supported" error

**Solutions**:
- Verify you're accessing via HTTPS (not HTTP)
- Check SSL certificate is valid
- Ensure using Meta Quest browser (not desktop browser)
- Try clearing browser cache

### Issue: Files not found (404 errors)

**Solutions**:
- Verify file structure is correct
- Check file permissions (644 for files, 755 for directories)
- Ensure index.html is in the correct location
- Check for typos in URLs

### Issue: JavaScript files not loading

**Solutions**:
- Verify MIME types in `.htaccess`
- Check file permissions
- Ensure `type="module"` is used in HTML
- Check browser console for specific errors

### Issue: SSL/HTTPS problems

**Solutions**:
- Install SSL certificate via cPanel
- Use AutoSSL for free Let's Encrypt certificate
- Contact hosting provider if SSL installation fails
- Verify domain DNS is pointing correctly

### Issue: Application loads but VR mode fails

**Solutions**:
- Ensure Meta Quest browser is updated
- Check WebXR API permissions
- Verify Quest firmware is up to date
- Try restarting the Quest device

### Issue: Database errors

**Solutions**:
- IndexedDB should work automatically in browser
- Clear browser data and try again
- Check browser console for specific error messages
- Verify JavaScript is enabled

## Maintenance

### Updating the Application

1. Download new version files
2. Back up current installation:
   - Use File Manager to create ZIP backup
   - Or download entire directory via FTP
3. Upload new files:
   - Overwrite existing files
   - Or delete old folder and upload new one
4. Clear browser cache
5. Test thoroughly

### Backing Up Data

User data is stored in browser's IndexedDB:
- **Important**: Data is stored on user's device, not server
- Each user's data is separate and local
- Server files only contain the application code
- Back up application files regularly via cPanel

### Monitoring

1. **Check error logs**:
   - cPanel → "Metrics" → "Errors"
   - Look for 404s or 500 errors

2. **Monitor bandwidth**:
   - cPanel → "Metrics" → "Bandwidth"
   - Track usage over time

3. **Review access logs**:
   - cPanel → "Metrics" → "Raw Access"
   - See who's using the app

## Security Best Practices

1. **Keep cPanel secure**:
   - Use strong passwords
   - Enable two-factor authentication
   - Regularly update cPanel password

2. **Protect directories**:
   - Don't store sensitive data in public_html
   - Use password protection if needed (cPanel → "Directory Privacy")

3. **Monitor access**:
   - Review logs regularly
   - Set up alerts for unusual activity

4. **Regular updates**:
   - Keep application files updated
   - Monitor for security patches
   - Update SSL certificates before expiry

## Advanced Configuration

### Custom Domain Setup

1. **Add domain in cPanel**:
   - "Domains" → "Addon Domains"
   - Enter new domain name
   - Set document root to installation directory

2. **Update DNS**:
   - Point domain A record to server IP
   - Wait for DNS propagation (up to 48 hours)

3. **Install SSL for new domain**:
   - Use AutoSSL or manually install certificate

### CDN Integration

To improve performance with CloudFlare or other CDN:

1. **Add site to CDN**
2. **Update DNS to CDN nameservers**
3. **Configure CDN settings**:
   - SSL: Full (strict)
   - Always Use HTTPS: On
   - Auto Minify: JS, CSS
   - Brotli: On

### Custom Error Pages

Create custom error pages:

1. Create `404.html` in installation directory
2. Add to `.htaccess`:
   ```apache
   ErrorDocument 404 /xr-memory/404.html
   ErrorDocument 500 /xr-memory/500.html
   ```

## Support Resources

- **cPanel Documentation**: https://docs.cpanel.net/
- **Let's Encrypt**: https://letsencrypt.org/
- **Meta Quest Developer**: https://developer.oculus.com/
- **WebXR Device API**: https://www.w3.org/TR/webxr/

## Additional Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review cPanel error logs
3. Contact your hosting provider's support
4. Open an issue on the project GitHub page

---

**Installation complete!** Your XR Memory Assistant should now be accessible on your Meta Quest device.

Remember to test thoroughly and ensure HTTPS is working before sharing with others.
