const casual = require('casual')
const fs = require('fs')
const axios = require('axios')
const queryString = require('query-string')
const uniqid = require('uniqid')

const axiosClient = axios.create({
  baseURL: 'https://mapi.sendo.vn/mob',
  headers: {
    'content-type': 'application/json',
  },
  paramsSerializer: (params) => queryString.stringify(params),
})

axiosClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.log(error)
  }
)

const searchProducts = async (queryParams) => {
  const url = '/product/search'
  const response = await axiosClient.get(url, { params: queryParams })
  return response.data
}

const getProductDetail = async (productId) => {
  const url = `/product/${productId}/detail/`
  return await axiosClient.get(url)
}

// ---------------

// Random 50 posts data
const posts = []
Array.from(new Array(50).keys()).map(() => {
  const post = {
    id: uniqid(),
    title: casual.title,
    author: casual.full_name,
    description: casual.words(50),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    imageUrl: `https://picsum.photos/id/${casual.integer(1, 1000)}/1368/400`,
  }

  posts.push(post)
})

const S3_IMAGE_URL = 'https://media3.scdn.vn'
const mapToProduct = (product) => {
  return {
    id: product.id,
    name: product.name,
    shortDescription: product.short_description,
    description: product.description,
    originalPrice: product.price,
    salePrice: product.final_price,
    isPromotion: product.is_promotion,
    promotionPercent: product.promotion_percent,
    images: product.images.map((url) => `${S3_IMAGE_URL}${url}`),
    isFreeShip: product.is_free_ship,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// https://techinsight.com.vn/tai-lieu-huong-dan-su-dung-api-vietnam-ai-hackathon
const categoryList = [
  {
    id: uniqid(),
    name: 'Thời trang',
    searchTerm: 'ao so mi nu',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uniqid(),
    name: 'Khẩu trang',
    searchTerm: 'khau trang',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uniqid(),
    name: 'Làm đẹp',
    searchTerm: 'lam dep',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uniqid(),
    name: 'Laptop',
    searchTerm: 'macbook',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uniqid(),
    name: 'Ổ cứng',
    searchTerm: 'o cung ssd',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uniqid(),
    name: 'Điện thoại',
    searchTerm: 'iphone',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]
const productList = []
const fetchProductList = async () => {
  // Loop through categories
  // Each cate, fetch list of product
  // Slide the first 20 items
  // Loop through each item and get detail
  // Then map to our product
  // Finally add to product list
  for (const category of categoryList) {
    const queryParams = {
      p: 1,
      q: category.searchTerm,
    }

    const productIdList = (await searchProducts(queryParams)).slice(0, 20).map((item) => item.id)
    for (const productId of productIdList) {
      const productData = await getProductDetail(productId)
      const transformedProduct = mapToProduct(productData)
      transformedProduct.categoryId = category.id

      productList.push(transformedProduct)
    }
    console.log('Done adding category', category.name, productIdList.length)
  }
}

const cityList = [
  {
    code: 'hcm',
    name: 'Hồ Chí Minh',
  },
  {
    code: 'hn',
    name: 'Hà Nội',
  },
  {
    code: 'dn',
    name: 'Đà Nẵng',
  },
  {
    code: 'pt',
    name: 'Phan Thiết',
  },
]

// Random 50 students data
const students = []
Array.from(new Array(50).keys()).map(() => {
  const post = {
    id: uniqid(),
    name: casual.full_name,
    age: casual.integer(18, 27),
    mark: Number.parseFloat(casual.double(3, 10).toFixed(1)),
    gender: ['male', 'female'][casual.integer(1, 100) % 2],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    city: ['hcm', 'hn', 'dn', 'pt'][casual.integer(1, 100) % 5],
  }

  students.push(post)
})

const tagList = [
  'Design',
  'Dashboard',
  'User Experience',
  'Computer Science',
  'ReactJS',
  'Frontend Development',
  'NextJS',
]

// Generate works
const thumbnailList = [
  'https://res.cloudinary.com/easy-frontend/image/upload/v1648712410/learn-nextjs/item1_cbidwn.jpg',
  'https://res.cloudinary.com/easy-frontend/image/upload/v1648712410/learn-nextjs/item2_usidpx.jpg',
  'https://res.cloudinary.com/easy-frontend/image/upload/v1648712410/learn-nextjs/item3_jlfuun.jpg',
]
const fullDescription =
  '<h2>Easy Frontend</h2><p><br></p><p><img src="https://res.cloudinary.com/easy-frontend/image/upload/v1692522044/upload-learn-nextjs/tziuz7e5f4ime4xlce3f.jpg"></p><p><br></p><p>learn <strong>nextjs</strong> is <span style="color: rgb(255, 153, 0);">fun</span></p><p><br></p><blockquote>super cool</blockquote><p><br></p><p>it works wohoo</p>'
const workList = []
for (let i = 1; i <= 20; i++) {
  const from = casual.integer(0, tagList.length - 1)
  const to = casual.integer(from, tagList.length - 1)
  console.log('tag list slice', from, to, tagList.slice(from, to))

  const workItem = {
    id: uniqid(),
    title: casual.title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tagList: tagList.slice(from, to),
    shortDescription:
      'Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet.',
    fullDescription,
    thumbnailUrl: thumbnailList[i % 3],
  }

  workList.push(workItem)
}

// Generate tnxs
const transactions = []
for (let i = 0; i < 10; i++) {
  const transaction = {
    id: uniqid(),
    date: casual.date('YYYY-MM-DD'),
    amount: casual.double(0.01, 10000).toFixed(2),
    description: casual.short_description,
    sender: casual.full_name,
    receiver: casual.full_name,
    status: casual.random_element(['pending', 'processing', 'completed', 'cancelled']),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  transactions.push(transaction)
}

// --------------------
// --------------------
const main = async () => {
  await fetchProductList()

  // Setup db object
  const db = {
    posts,
    categories: categoryList,
    products: productList,
    students,
    cities: cityList,
    works: workList,
    tags: tagList,
    transactions,
    'public-profile': {
      id: 'public-profile',
      name: casual.full_name,
      city: casual.city,
      email: casual.email.toLowerCase(),
    },
  }

  // Save posts array to db.json file
  fs.writeFile('db.json', JSON.stringify(db), () => {
    console.log(`Generate ${posts.length} sample post records and saved in db.json!!! =))`)
  })
}
main()
