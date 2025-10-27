# cPanel Installation Guide for XRCapt Passthrough Apps

This guide will help you deploy all XRCapt Passthrough applications to your cPanel web hosting service.

## Prerequisites

- Access to a cPanel hosting account
- FTP credentials or File Manager access
- Domain or subdomain configured
- SSL certificate (recommended for WebXR)

## Installation Methods

### Method 1: File Manager (Recommended for Beginners)

1. **Login to cPanel**
   - Navigate to your hosting provider's cPanel login page
   - Enter your credentials

2. **Access File Manager**
   - In cPanel, find and click "File Manager"
   - Navigate to `public_html` (or your domain's root directory)

3. **Upload Files**
   - Click "Upload" button in the toolbar
   - Select all files from your local `passthrough` folder
   - Wait for upload to complete (you should see a green progress bar)

4. **Extract/Organize Files**
   - Ensure the folder structure is preserved:
     ```
     public_html/
     └── passthrough/
         ├── index.html
         ├── app.js
         └── staging/
             ├── 1/
             │   ├── index.html
             │   └── app.js
             ├── 2/
             │   ├── index.html
             │   └── app.js
             ├── 3/
             │   ├── index.html
             │   └── app.js
             └── 4/
                 ├── index.html
                 └── app.js
     ```

5. **Set Permissions**
   - Select all uploaded files
   - Click "Change Permissions"
   - Set directories to 755
   - Set files to 644

### Method 2: FTP Upload (Recommended for Advanced Users)

1. **Connect via FTP**
   - Use an FTP client (FileZilla, Cyberduck, or WinSCP)
   - Enter your FTP credentials:
     - Host: ftp.yourdomain.com
     - Username: your_cpanel_username
     - Password: your_cpanel_password
     - Port: 21 (or 22 for SFTP)

2. **Navigate to Root Directory**
   - Go to `public_html` or your domain's root directory

3. **Upload Passthrough Folder**
   - Drag and drop the entire `passthrough` folder
   - Ensure all subdirectories are uploaded
   - Verify folder structure matches the one above

4. **Set Correct Permissions**
   - Right-click on folders → Permissions → 755
   - Right-click on files → Permissions → 644

### Method 3: Using cPanel's Remote Git Version Control (Advanced)

1. **Access Git Version Control**
   - In cPanel, find "Git Version Control"
   - Click "Create"

2. **Clone Repository**
   - Enter repository URL: `https://github.com/acesonder/XRCapt.git`
   - Choose destination path: `/public_html/xrcapt`
   - Click "Create"

3. **Copy Passthrough Folder**
   - Use File Manager to copy `/public_html/xrcapt/passthrough` to `/public_html/passthrough`

## Post-Installation Configuration

### Configure .htaccess (Optional but Recommended)

Create a `.htaccess` file in the `passthrough` folder with the following content:

```apache
# Enable HTTPS redirect (if SSL is available)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Set proper MIME types for WebXR
AddType application/javascript .js
AddType text/html .html

# Enable CORS for Three.js CDN resources
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>

# Enable compression for faster loading
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript
</IfModule>

# Set cache control for static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 0 seconds"
    ExpiresByType application/javascript "access plus 1 week"
</IfModule>

# Custom error pages
ErrorDocument 404 /passthrough/404.html
ErrorDocument 500 /passthrough/500.html

# Directory listings
Options -Indexes
DirectoryIndex index.html
```

### Create 404 Error Page (Optional)

Create `passthrough/404.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        h1 { font-size: 5em; margin: 0; }
        p { font-size: 1.5em; }
        a { color: #fff; text-decoration: underline; }
    </style>
</head>
<body>
    <div>
        <h1>404</h1>
        <p>Page Not Found</p>
        <p><a href="/passthrough/">Return to Home</a></p>
    </div>
</body>
</html>
```

## Accessing Your Applications

After installation, access your apps at the following URLs:

- **Main Passthrough App**: `https://yourdomain.com/passthrough/`
- **App 1 (Object Detection)**: `https://yourdomain.com/passthrough/staging/1/`
- **App 2 (Photo Gallery)**: `https://yourdomain.com/passthrough/staging/2/`
- **App 3 (Statistics)**: `https://yourdomain.com/passthrough/staging/3/`
- **App 4 (Complete MR)**: `https://yourdomain.com/passthrough/staging/4/`

## SSL/HTTPS Setup (Required for WebXR)

WebXR requires HTTPS to function. If you don't have SSL:

1. **Free SSL with Let's Encrypt**
   - In cPanel, find "SSL/TLS Status"
   - Click "Run AutoSSL"
   - Wait for certificate to be issued

2. **Alternative: Use Cloudflare**
   - Sign up at cloudflare.com
   - Add your domain
   - Change nameservers as instructed
   - Enable SSL in Cloudflare dashboard

## Testing the Installation

1. **Test on Desktop Browser First**
   - Open `https://yourdomain.com/passthrough/` in Chrome or Edge
   - Check browser console for errors (F12)
   - Verify Three.js loads correctly

2. **Test on Meta Quest 3S**
   - Put on your headset
   - Open Meta Quest Browser
   - Navigate to `https://yourdomain.com/passthrough/`
   - Grant necessary permissions
   - Click "Enter Passthrough Mode"

## Troubleshooting

### Issue: "WebXR not available"
- **Solution**: Ensure you're using HTTPS (not HTTP)
- Check that you're using Meta Quest Browser (not another browser)

### Issue: Three.js not loading
- **Solution**: Check internet connection on server
- Verify CDN link is not blocked
- Check browser console for errors

### Issue: 403 Forbidden error
- **Solution**: Check file permissions (should be 644)
- Check folder permissions (should be 755)
- Verify .htaccess doesn't have conflicting rules

### Issue: Blank page loads
- **Solution**: Check browser console for JavaScript errors
- Verify all files uploaded correctly
- Check that file paths are correct

### Issue: IndexedDB errors
- **Solution**: Clear browser cache and cookies
- Check that browser supports IndexedDB
- Verify site has proper permissions

## Performance Optimization

### Enable PHP OPcache (if available)
In cPanel → Select PHP Version → Options:
- Enable `opcache.enable`
- Set `opcache.memory_consumption = 128`

### Enable Browser Caching
Already configured in .htaccess above

### Use CDN (Optional)
Consider using Cloudflare or another CDN for:
- Faster asset delivery
- DDoS protection
- Additional caching

## Maintenance

### Regular Backups
1. In cPanel, go to "Backup"
2. Click "Download a Full Account Backup"
3. Store safely offsite

### Monitoring
- Check error logs: cPanel → Errors
- Monitor bandwidth: cPanel → Bandwidth
- Check visitor stats: cPanel → AWStats or Webalizer

## Security Best Practices

1. **Keep cPanel Updated**
   - Your host usually handles this automatically

2. **Use Strong Passwords**
   - Change default passwords
   - Use password manager

3. **Regular Security Scans**
   - Use cPanel security tools
   - Install security plugins if available

4. **Backup Regularly**
   - Weekly full backups recommended
   - Test restore procedures

## Support

For issues specific to:
- **cPanel**: Contact your hosting provider's support
- **Application bugs**: Open an issue on GitHub
- **WebXR issues**: Check Meta Developer documentation

## Batch Installation Script (Advanced)

For advanced users with SSH access, create `install.sh`:

```bash
#!/bin/bash
# XRCapt Passthrough Installation Script for cPanel

echo "XRCapt Passthrough Installer"
echo "============================"

# Variables
INSTALL_DIR="/home/$USER/public_html/passthrough"

# Create directory structure
echo "Creating directory structure..."
mkdir -p $INSTALL_DIR/staging/{1,2,3,4}

# Set permissions
echo "Setting permissions..."
find $INSTALL_DIR -type d -exec chmod 755 {} \;
find $INSTALL_DIR -type f -exec chmod 644 {} \;

echo "Installation complete!"
echo "Upload your files to: $INSTALL_DIR"
echo "Access at: https://yourdomain.com/passthrough/"
```

Make executable and run:
```bash
chmod +x install.sh
./install.sh
```

## Next Steps

After successful installation:
1. Test all 5 applications (main + 4 staging apps)
2. Review the FUTURE_UPDATES.md for planned features
3. Customize branding and colors if desired
4. Share the URL with users
5. Monitor usage and gather feedback

---

**Note**: This installation guide assumes a standard cPanel setup. Some hosting providers may have slightly different interfaces or features. Consult your hosting provider's documentation if you encounter any variations.
