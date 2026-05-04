exports.mapHouse = (house) => {
    if (!house) return undefined;

    return {
        houseId: house.house_id,
        name: house.name,
        location: house.location,
        phoneNumber: house.phone_number,
        description: house.description,
        image: house.image,
    };
};
