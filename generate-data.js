const casual = require('casual');
const fs = require('fs');
const axios = require('axios');
const queryString = require('query-string');

const axiosClient = axios.create({
  baseURL: 'https://mapi.sendo.vn/mob',
  headers: {
    'content-type': 'application/json',
  },
  paramsSerializer: params => queryString.stringify(params),
});

axiosClient.interceptors.response.use((response) => {
  return response.data;
}, (error) => {
  console.log(error);
});

const searchProducts = async (queryParams) => {
  const url = '/product/search';
  const response = await axiosClient.get(url, { params: queryParams });
  return response.data;
}

const getProductDetail = async (productId) => {
  const url = `/product/${productId}/detail/`;
  return await axiosClient.get(url);
};


// ---------------

// Random 50 posts data
const posts = [];
Array.from(new Array(50).keys()).map(() => {
  const post = {
    id: casual.uuid,
    title: casual.title,
    author: casual.full_name,
    description: casual.words(50),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    imageUrl: `https://picsum.photos/id/${casual.integer(1, 1000)}/1368/400`,
  };

  posts.push(post);
});


const S3_IMAGE_URL = 'https://media3.scdn.vn';
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
    images: product.images.map(url => `${S3_IMAGE_URL}${url}`),
    isFreeShip: product.is_free_ship,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

// https://techinsight.com.vn/tai-lieu-huong-dan-su-dung-api-vietnam-ai-hackathon
const categoryList = [
  { id: casual.uuid, name: 'Thời trang', searchTerm: 'ao so mi nu', createdAt: Date.now(), updatedAt: Date.now(), },
  { id: casual.uuid, name: 'Khẩu trang', searchTerm: 'khau trang', createdAt: Date.now(), updatedAt: Date.now(), },
  { id: casual.uuid, name: 'Làm đẹp', searchTerm: 'lam dep', createdAt: Date.now(), updatedAt: Date.now(), },
  { id: casual.uuid, name: 'Laptop', searchTerm: 'macbook', createdAt: Date.now(), updatedAt: Date.now(), },
  { id: casual.uuid, name: 'Ổ cứng', searchTerm: 'o cung ssd', createdAt: Date.now(), updatedAt: Date.now(), },
  { id: casual.uuid, name: 'Điện thoại', searchTerm: 'iphone', createdAt: Date.now(), updatedAt: Date.now(), },
];
const productList = [];
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
    };

    const productIdList = (await searchProducts(queryParams)).slice(0, 20).map(item => item.id);
    for (const productId of productIdList) {
      const productData = await getProductDetail(productId);
      const transformedProduct = mapToProduct(productData);
      transformedProduct.categoryId = category.id;

      productList.push(transformedProduct);
    }
    console.log('Done adding category', category.name, productIdList.length);
  }
}

// --------------------
// --------------------
const main = async () => {
  await fetchProductList();


  // Setup db object
  const db = {
    posts,
    categories: categoryList,
    products: productList,
  };

  // Save posts array to db.json file
  fs.writeFile('db.json', JSON.stringify(db), () => {
    console.log(`Generate ${posts.length} sample post records and saved in db.json!!! =))`);
  });
};
main();
