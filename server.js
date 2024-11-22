const express = require('express');
const axios = require('axios');
const cors = require('cors');  // Import cors

const app = express();
const PORT = 3000;

// Sử dụng CORS cho tất cả các yêu cầu
app.use(cors());

// Middleware để xử lý JSON và dữ liệu gửi từ client
app.use(express.json()); // Xử lý dữ liệu JSON trong body
app.use(express.urlencoded({ extended: true })); // Xử lý dữ liệu dạng form

// Endpoint nhận ACCESS_TOKEN và COOKIE từ client
// API lấy data từ Facebook (sử dụng khi đã có id_story_fbid)
app.post('/get-facebook-data', async (req, res) => {
    const { accessToken, cookie, idPost } = req.body;

    // Kiểm tra xem client có gửi đủ thông tin hay không
    if (!accessToken || !cookie || !idPost) {
        return res.status(400).send("Missing ACCESS_TOKEN, COOKIE, or idPost");
    }

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://graph.facebook.com/v21.0/${idPost}?fields=reactions.summary(true),shares,comments.summary(true).filter(stream).limit(0),picture&access_token=${accessToken}`,
        headers: {
            'Cookie': cookie
        }
    };

    try {
        const response = await axios.request(config);

        // Lấy các giá trị cần thiết từ response
        const { reactions, shares, comments, picture, id } = response.data;

        // Trả về các giá trị cần thiết cho client
        const result = {
            reactions_count: reactions?.summary?.total_count || 0,
            shares_count: shares?.count || 0,
            comments_count: comments?.summary?.total_count || 0,
            picture: picture || null,  // Nếu có ảnh thì trả về, nếu không trả về null
            id
        };

        res.json(result); // Trả dữ liệu cho client
    } catch (error) {
        const result = {
            reactions_count:  0,
            shares_count: 0,
            comments_count: 0,
            picture: null,  // Nếu có ảnh thì trả về, nếu không trả về null
            idPost
        };

        res.json(result); // Trả dữ liệu cho client
        console.error("Error fetching Facebook data:", error.message);
        // res.status(500).send("Error fetching Facebook data");
    }
});


// API lấy redirect URL của một link
app.post('/get-redirect-id-from-url', async (req, res) => {
    const { url, cookie } = req.body;

    // Kiểm tra xem client có gửi đủ thông tin không
    if (!url || !cookie) {
        return res.status(400).send("Missing URL or Cookie");
    }

    try {
        // Sử dụng axios để gửi yêu cầu HTTP với phương thức 'HEAD'
        const response = await axios.head(url, {
            maxRedirects: 5, // Tối đa 5 lần redirect
            validateStatus: (status) => status >= 200 && status < 400, // Chấp nhận tất cả trạng thái từ 2xx đến 3xx
           
        });

        // Lấy URL cuối cùng sau khi redirect
        const redirectedUrl = response.path;
      
        console.log(response)
        // Phân tích URL đã redirect để lấy tham số
        const urlObj = new URL(redirectedUrl);
     
        const story_fbid = urlObj.searchParams.get('story_fbid');
        const id = urlObj.searchParams.get('id');

        if (story_fbid && id) {
            // Ghép lại thành id_story_fbid
            const id_story_fbid = `${id}_${story_fbid}`;
            //console.log(id_story_fbid)
            res.json({ id_story_fbid });
        } else {
            res.status(400).send("Missing required parameters (story_fbid or id)");
        }

    } catch (error) {
        console.error("Error fetching redirect URL or parsing:", error.message);
        res.status(500).send("Error fetching redirect URL or parsing");
    }
});

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});