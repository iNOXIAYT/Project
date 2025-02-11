import axios from "axios"
import * as cheerio from "cheerio"
import { extractCurrency, extractDescription, extractPrice } from "../utils";
import { images } from "@/next.config";
export async function scrapeAmazonProduct(url : string){
    if(!url) return;

    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 33335;
    const session_id = (1000000 * Math.random()) | 0;
    const options={
        auth:{
            username: `${username}-session-${session_id}`,
            password,
        },
        host: `brd.superproxy.io`,
        port,
        rejectUnauthorized: false,
    }
    try{
        //fetch the product page
        const response = await axios.get(url,options);
        const $ = cheerio.load(response.data)

        const title = $("#productTitle").text().trim();
        const currentPrice = extractPrice(
            $('priceToPay span.a-price-whole'),
            $('a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
            $('.a-price.a-text-price')
        );

        const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
        );

        const outOfStock = $("#availability span").text().trim().toLowerCase()=== "currently unavailable";

        const images = 
            $('#imgBlkFront').attr('data-a-dynamic-image') ||
            $('#landingImage').attr('data-a-dynamic-image') ||
            "{}"

        const imageUrls = Object.keys(JSON.parse(images));

        const currency = extractCurrency($(".a-price-symbol"))
        const discountRate = $('.savingPercentage').text().replace(/[-%]/g,"");

        const breadcrumb = $("#wayfinding-breadcrumbs_feature_div .a-breadcrumb")
        .text()
        .trim()
        .split(">")
        .map((category) => category.trim())
        .filter((category) => category.length > 0);
    
        let category = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : "Unknown";
            if (!category || category === "Unknown") {
            const altBreadcrumb = $(".a-breadcrumb span.a-list-item")
            .map((_, element) => $(element).text().trim())
            .get()
            .filter((category) => category.length > 0);

        category = altBreadcrumb.length > 0 ? altBreadcrumb[altBreadcrumb.length - 1] : "Unknown";
        }

        const extractDescription = ($: cheerio.CheerioAPI): string => {
            let description = $("#productDescription").text().trim();

            if (!description) {
                description = $("#feature-bullets ul li span")
                    .map((_, el) => $(el).text().trim())
                    .get()
                    .join(" ");
            }

            
            description = description.replace(
                /(Sort by reviews type|Verified Purchase|Helpful Report|Top reviews|Most recent)/gi,
                ""
            );

            
            description = description.replace(/\s{2,}/g, " ").trim();

          
            // const words = description.split(/\s+/);
            return description;
        };

        const description = extractDescription($)
    
        const data = {
            url,currency : currency || "$",
            image : imageUrls[0],
            title,
            currentPrice : Number(currentPrice),
            originalPrice : Number(originalPrice),
            priceHistory : [],
            discountRate : Number(discountRate),
            category,
            reviewsCount : 100,
            stars : 4.5,
            isOutOfStock : outOfStock,
            description,
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(originalPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice),
        }

        return data;
        //[just to check] console.log({title,currentPrice, originalPrice,outOfStock,imageUrls,discountRate,data})

    } catch(error:any){
        throw new Error(`Failed to scrape product: $error.message`)
    }
}
